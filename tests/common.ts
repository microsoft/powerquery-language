import path = require('path');
import vsctm = require('vscode-textmate');
import { Lexer, Token, LineToken } from "@microsoft/powerquery-parser";
import { expect } from "chai";
import "mocha";

function getGrammarFilePath(): string {
    return path.join(__dirname, '..', "PowerQuery.tmLanguage");
}

export const registry = new vsctm.Registry();
export const grammar = registry.loadGrammarFromPathSync(getGrammarFilePath());
export const LINE_TERMINATOR: string = "\n";

// Grammar constants
export class Scopes {
    public static QuoteStringBegin = "punctuation.definition.string.begin.powerquery";
    public static QuoteStringEnd = "punctuation.definition.string.end.powerquery";
    public static String = "string.quoted.double.powerquery";
    public static QuotedIdentifierBegin = "punctuation.definition.quotedidentifier.begin.powerquery";
    public static QuotedIdentifierEnd = "punctuation.definition.quotedidentifier.end.powerquery";
    public static Identifier = "entity.name.powerquery";
    public static BlockComment = "comment.block.powerquery";
}

export class TokenComparer {
    public readonly grammarTokens: vsctm.IToken[];
    public readonly parserTokens: ReadonlyArray<LineToken>;

    constructor(grammarTokens: vsctm.IToken[], parserTokens: ReadonlyArray<LineToken>) {
        this.grammarTokens = grammarTokens;
        this.parserTokens = parserTokens;

        expect(this.parserTokens.length).greaterThan(0, "parserTokens should have at least one token");
        expect(this.grammarTokens.length).greaterThan(0, "grammarTokens should have at least one token");
    }

    public assertSame() {
        this.assertTokenCount();
        this.assertTokenOffsets();
    }

    public assertTokenCount() {
        expect(this.parserTokens.length).equals(this.grammarTokens.length, "token counts are not equal");
    }

    public assertTokenOffsets() {
        for (let i = 0; i < this.parserTokens.length; i++) {
            const pt = this.parserTokens[i];
            const gt = this.grammarTokens[i];

            expect(pt.positionStart.columnNumber).eq(gt.startIndex, "startIndex does not match");
            expect(pt.positionEnd.columnNumber).eq(gt.endIndex, "endIndex does not match");
        }
    }

    public static NormalizeGrammarTokens(tokens: vsctm.IToken[]): vsctm.IToken[] {
        let result: vsctm.IToken[] = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // PQ doesn't return tokens for whitespace. 
            // Remove them from the grammar results.
            if (token.scopes.length == 1) {
                continue;
            }

            // TODO: multiline tokens?

            // PQ returns strings as a single token.
            // Grammar returns separate tokens for punctuation.
            if (token.scopes.includes(Scopes.QuoteStringBegin) || token.scopes.includes(Scopes.QuotedIdentifierBegin)) {
                var startIndex = token.startIndex;

                // next token should be string
                let middleToken = tokens[++i];
                let scopes = middleToken.scopes;

                // final token should be end quote
                let endToken = tokens[++i];
                let endIndex = endToken.endIndex;

                // sanity
                if (token.scopes.includes(Scopes.QuoteStringBegin)) {
                    expect(scopes).contains(Scopes.String, "middle token should be a string");
                    expect(endToken.scopes).contains(Scopes.QuoteStringEnd, "third token should be end quote");
                } else {
                    expect(scopes).contains(Scopes.Identifier, "middle token should be an identifier");
                    expect(endToken.scopes).contains(Scopes.QuotedIdentifierEnd, "third token should be end quote");
                }

                result.push({
                    startIndex: startIndex,
                    scopes: scopes,
                    endIndex: endIndex
                });
            } else if (token.scopes.includes(Scopes.BlockComment)) {
                // Open and close block comment + comment content are separate tokens.
                // Combine them to match parser representation.
                let currentToken = token;
                let endIndex: number = null;
                while (currentToken.scopes.includes(Scopes.BlockComment) && (i + 1) < tokens.length) {
                    endIndex = currentToken.endIndex;
                    currentToken = tokens[++i];
                }

                result.push({
                    startIndex: token.startIndex,
                    scopes: token.scopes,
                    endIndex: endIndex
                });
            } else {
                result.push(token);
            }
        }

        return result;
    }
}

export class SingleLineTokenComparer extends TokenComparer {
    constructor(query: string, normalize: boolean = true) {
        let pqlex: Lexer.State = Lexer.from(query, LINE_TERMINATOR);

        // remove whitespace tokens from grammar result
        let r = grammar.tokenizeLine(query, null);
        let grammarTokens = normalize ? TokenComparer.NormalizeGrammarTokens(r.tokens) : r.tokens;

        super(grammarTokens, pqlex.lines[0].tokens);
    }
}
