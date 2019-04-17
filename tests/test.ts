import path = require('path');
import vsctm = require('vscode-textmate');
import { Lexer, Token } from 'powerquery-parser';
import { expect, should } from "chai";
import "mocha";

function getGrammarFilePath(): string {
    return path.join(__dirname, '..', "PowerQuery.tmLanguage");
}

const registry = new vsctm.Registry();
const grammar = registry.loadGrammarFromPathSync(getGrammarFilePath());

// Grammar constants
const QuoteStringBeginScope = "punctuation.definition.string.begin.powerquery";
const QuoteStringEndScope = "punctuation.definition.string.end.powerquery";
const StringScope = "string.quoted.double.powerquery";
const QuotedIdentifierBeginScope = "punctuation.definition.quotedidentifier.begin.powerquery";
const QuotedIdentifierEndScope = "punctuation.definition.quotedidentifier.end.powerquery";
const IdentifierScope = "entity.name.powerquery";

// Query constants
const QueryMultiline = `let
    a = 1,
    b = "text",
    c = Text.From(a)
in
    c`;

class TokenComparer {
    public readonly grammarTokens: vsctm.IToken[];
    public readonly parserTokens: readonly Token[];

    constructor(grammarTokens: vsctm.IToken[], parserTokens: readonly Token[]) {
        this.grammarTokens = grammarTokens;
        this.parserTokens = parserTokens;

        expect(this.parserTokens.length).greaterThan(0, "parserTokens should have at least one token");
        expect(this.grammarTokens.length).greaterThan(0, "grammarTokens should have at least one token");
    }

    public assertTokenCount() {
        expect(this.parserTokens.length).equals(this.grammarTokens.length, "token counts are not equal");
    }

    public assertTokenOffsets() {
        for (let i = 0; i < this.parserTokens.length; i++) {
            const pt = this.parserTokens[i];
            const gt = this.grammarTokens[i];

            expect(pt.documentStartIndex).eq(gt.startIndex, "startIndex does not match");
            expect(pt.documentEndIndex).eq(gt.endIndex, "endIndex does not match");
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

            // PQ returns strings as a single token.
            // Grammar returns separate tokens for punctuation.
            // TODO: multiline string tokens?
            if (token.scopes.includes(QuoteStringBeginScope) || token.scopes.includes(QuotedIdentifierBeginScope)) {
                var startIndex = token.startIndex;

                // next token should be string
                var middleToken = tokens[++i];
                var scopes = middleToken.scopes;

                // final token should be end quote
                var endToken = tokens[++i];
                var endIndex = endToken.endIndex;

                // sanity
                if (token.scopes.includes(QuoteStringBeginScope)) {
                    expect(scopes).contains(StringScope, "middle token should be a string");
                    expect(endToken.scopes).contains(QuoteStringEndScope, "third token should be end quote");
                } else {
                    expect(scopes).contains(IdentifierScope, "middle token should be an identifier");
                    expect(endToken.scopes).contains(QuotedIdentifierEndScope, "third token should be end quote");
                }

                result.push({
                    startIndex: startIndex,
                    scopes: scopes,
                    endIndex: endIndex
                });

                continue;
            }

            result.push(token);
        }

        return result;
    }
}

class SingleLineTokenComparer extends TokenComparer {
    constructor(query: string, normalize: boolean = true) {
        let pqlex: Lexer.TLexer = Lexer.from(query);
        pqlex = Lexer.remaining(pqlex);

        // remove whitespace tokens from grammar result
        let r = grammar.tokenizeLine(query, null);
        let grammarTokens = normalize ? TokenComparer.NormalizeGrammarTokens(r.tokens): r.tokens;

        super(grammarTokens, pqlex.tokens);
    }
}

describe("Basic grammar tests", () => {
    it("Grammar loaded", () => {
        expect(grammar).to.exist;
    }),

        it("Tokens", () => {
            let state = null;
            let lines = QueryMultiline.split("\n");

            for (let i = 0; i < lines.length; i++) {
                let r = grammar.tokenizeLine(lines[i], state);
                state = r.ruleStack;
                expect(r.tokens.length).to.be.greaterThan(0);
            }
        });
});

describe("Compare parser tokens", () => {
    it("Logical", () => {
        const query = "if true then true else false";
        const r = new SingleLineTokenComparer(query);
        r.assertTokenCount();
        r.assertTokenOffsets();
    }),
        it("Text", () => {
            const query = "\"string one\" & \"string 2\"";
            const r = new SingleLineTokenComparer(query);
            r.assertTokenCount();
            r.assertTokenOffsets();
        }),
        it("Numbers", () => {
            const query = "1 1.1 5e123 534.1223 2.2e555 -1.3";
            const r = new SingleLineTokenComparer(query);
            r.assertTokenCount();
            r.assertTokenOffsets();
        }),
        it("Quoted identifier", () => {
            const query = "#\"identifier with spaces\"";
            const r = new SingleLineTokenComparer(query);
            r.assertTokenCount();
            r.assertTokenOffsets();
        }),
        // TODO: Grammar returns single token (good), but it ends at '.' (bad)
        xit("Identifier", () => {
            const query = "Table.FromRecords";
            const r = new SingleLineTokenComparer(query);
            r.assertTokenCount();
            r.assertTokenOffsets();
        }),
        it("simple function", () => {
            const query = "x = () => 1";
            const r = new SingleLineTokenComparer(query);
            r.assertTokenCount();
            r.assertTokenOffsets();
        }),
        // TODO: duration is flagged as type, but starting # is ignored
        xit("duration constructor", () => {
            const query = "#duration(1,1,1,1)";
            const r = new SingleLineTokenComparer(query);
            r.assertTokenCount();
            r.assertTokenOffsets();
        })
});

describe("Incremental parsing", () => {
    it("Simple", () => {
        let grammarState: vsctm.StackElement = null;
        let pqState: Lexer.TLexer = null;
        let lastTokenCount: number = 0;

        let lines = QueryMultiline.split("\n");

        for (let i = 0; i < lines.length; i++) {
            let r = grammar.tokenizeLine(lines[i], grammarState);
            grammarState = r.ruleStack;
            
            if (pqState == null) {
                pqState = Lexer.from(lines[i]);                
            } else {
                pqState = Lexer.appendToDocument(pqState, lines[i]);
            }

            lastTokenCount = pqState.tokens.length;

            pqState = Lexer.remaining(pqState);

            let gTokens = TokenComparer.NormalizeGrammarTokens(r.tokens);
            let comparer = new TokenComparer(gTokens, pqState.tokens.slice(lastTokenCount));

            comparer.assertTokenCount();
            // TODO: PQ offsets are based on document position rather than line position
            // comparer.assertTokenOffsets();
        }
    })
});