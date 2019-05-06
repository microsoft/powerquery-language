import path = require('path');
import vsctm = require('vscode-textmate');
import { Lexer, Token, LineToken, LineTokenKind } from "@microsoft/powerquery-parser";
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
    public static Default = "source.powerquery";
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
        this.assertTokens();
    }

    public assertTokenCount() {
        expect(this.parserTokens.length).equals(this.grammarTokens.length, "token counts are not equal");
    }

    public assertTokens() {
        for (let i = 0; i < this.parserTokens.length; i++) {
            const pt = this.parserTokens[i];
            const gt = this.grammarTokens[i];

            let equivalentScope = LineTokenKindToScope(pt.kind);
            let lastScope = gt.scopes[gt.scopes.length -1];
            
            if (equivalentScope.endsWith(".powerquery")) {
                expect(lastScope).eq(equivalentScope, "expected scope did not match");
            } else {
                // support partial scope match
                expect(lastScope.startsWith(equivalentScope), "unexpected scope prefix");
            }

            expect(pt.positionStart.columnNumber).eq(gt.startIndex, "startIndex for token '" + pt.data + "' does not match. Grammar token: '" + gt.scopes[1] + "'");
            expect(pt.positionEnd.columnNumber).eq(gt.endIndex, "endIndex for token '" + pt.data + "' does not match. Grammar token: '" + gt.scopes[1] + "'");
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
            // TODO: PQ doesn't handle escape sequences

            // PQ returns strings as a single token.
            // Grammar returns separate tokens for quotes.
            if (token.scopes.includes(Scopes.QuotedIdentifierBegin)) {
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
            } else if (token.scopes.includes(Scopes.QuoteStringBegin)) {
                let currentToken = token;
                let endIndex: number = null;
                while (!currentToken.scopes.includes(Scopes.QuoteStringEnd) && (i + 1) < tokens.length) {                    
                    currentToken = tokens[++i];
                    endIndex = currentToken.endIndex;
                }

                result.push({
                    startIndex: token.startIndex,
                    scopes: [Scopes.Default, Scopes.String],
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

export function Compare(expression: string) {
    const query = "\"string one\" & \"string 2\"";
    const r = new SingleLineTokenComparer(query);
    r.assertSame();
}

class SingleLineTokenComparer extends TokenComparer {
    constructor(query: string, normalize: boolean = true) {
        let pqlex: Lexer.State = Lexer.from(query, LINE_TERMINATOR);

        // remove whitespace tokens from grammar result
        let r = grammar.tokenizeLine(query, null);
        let grammarTokens = normalize ? TokenComparer.NormalizeGrammarTokens(r.tokens) : r.tokens;

        super(grammarTokens, pqlex.lines[0].tokens);
    }
}

// TODO: nullable and optional?
function LineTokenKindToScope(tokenKind: LineTokenKind): string {
    switch (tokenKind) {
        case LineTokenKind.Ampersand:
            return "keyword.operator.combination.powerquery";
        case LineTokenKind.Asterisk:
            return "keyword.operator.arithmetic.powerquery";
        case LineTokenKind.AtSign:
            return "keyword.operator.inclusiveidentifier.powerquery";
        case LineTokenKind.Bang:
            return "keyword.operator.sectionaccess.powerquery";
        case LineTokenKind.Comma:
            return "punctuation.separator.powerquery";
        case LineTokenKind.Division:
            return "keyword.operator.arithmetic.powerquery";
        case LineTokenKind.Ellipsis:
            return "keyword.operator.ellipsis.powerquery";
        case LineTokenKind.Equal:
            return "keyword.operator.assignment-or-comparison.powerquery";
        case LineTokenKind.FatArrow:
            return "keyword.operator.function.powerquery";
        case LineTokenKind.GreaterThan:
            return "keyword.operator.comparison.powerquery";
        case LineTokenKind.GreaterThanEqualTo:
            return "keyword.operator.comparison.powerquery";            
        case LineTokenKind.HexLiteral:
            return "constant.numeric.integer.hexadecimal.powerquery";   // TODO: add test
        case LineTokenKind.Identifier:
            return "entity.name.powerquery";
        case LineTokenKind.KeywordAnd:
            return "keyword.operator.word.logical.powerquery";
        case LineTokenKind.KeywordAs:
            return "keyword.other.powerquery";
        case LineTokenKind.KeywordEach:
            return "keyword.other.powerquery";
        case LineTokenKind.KeywordElse:
            return "keyword.control.conditional.powerquery";
        case LineTokenKind.KeywordError:
            return "keyword.other.powerquery";
        case LineTokenKind.KeywordFalse:
            return "constant.language.logical.powerquery";
        case LineTokenKind.KeywordHashInfinity:            
            return "constant.language.numeric.float.powerquery";
        case LineTokenKind.KeywordHashNan:
            return "constant.language.numeric.float.powerquery";
        case LineTokenKind.KeywordHashSections:
            return "constant.language.intrinsicvariable.powerquery";
        case LineTokenKind.KeywordHashShared:
            return "constant.language.intrinsicvariable.powerquery";
        case LineTokenKind.KeywordIf:
            return "keyword.control.conditional.powerquery";
        case LineTokenKind.KeywordIn:
            return "keyword.other.powerquery";
        case LineTokenKind.KeywordIs:
            return "keyword.other.powerquery";
        case LineTokenKind.KeywordLet:
            return "keyword.other.powerquery";
        case LineTokenKind.KeywordMeta:
            return "keyword.other.powerquery";
        case LineTokenKind.KeywordNot:
            return "keyword.operator.word.logical.powerquery";
        case LineTokenKind.KeywordOr:
            return "keyword.operator.word.logical.powerquery";
        case LineTokenKind.KeywordOtherwise:
            return "keyword.control.exception.powerquery";
        case LineTokenKind.KeywordSection:
            return "keyword.powerquery";
        case LineTokenKind.KeywordShared:
            return "keyword.powerquery";
        case LineTokenKind.KeywordThen:
            return "keyword.control.conditional.powerquery";
        case LineTokenKind.KeywordTrue:
            return "constant.language.logical.powerquery";
        case LineTokenKind.KeywordTry:
            return "keyword.control.exception.powerquery";
        case LineTokenKind.KeywordType:
            return "keyword.other.powerquery";
        case LineTokenKind.LeftBrace:
            return "punctuation.section.braces.begin.powerquery";
        case LineTokenKind.LeftBracket:
            return "punctuation.section.brackets.begin.powerquery";
        case LineTokenKind.LeftParenthesis:
            return "punctuation.section.parens.begin.powerquery";
        case LineTokenKind.LessThan:
            return "keyword.operator.comparison.powerquery";
        case LineTokenKind.LessThanEqualTo:
            return "keyword.operator.comparison.powerquery";
        case LineTokenKind.Minus:
            return "keyword.operator.arithmetic.powerquery";
        case LineTokenKind.NotEqual:
            return "keyword.operator.comparison.powerquery";
        case LineTokenKind.NullLiteral:
            return "constant.language.null.powerquery";
        case LineTokenKind.NumericLiteral:
            return "constant.numeric."; // partial
        case LineTokenKind.Plus:
            return "keyword.operator.arithmetic.powerquery";
        case LineTokenKind.QuestionMark:
            return "keyword.operator.optional.powerquery";
        case LineTokenKind.RightBrace:
            return "punctuation.section.braces.end.powerquery";
        case LineTokenKind.RightBracket:
            return "punctuation.section.brackets.end.powerquery";
        case LineTokenKind.RightParenthesis:
            return "punctuation.section.parens.end.powerquery";
        case LineTokenKind.Semicolon:
            return "punctuation.semicolon.powerquery";        
        // Comments
        case LineTokenKind.LineComment:
            return "comment.line.double-slash.powerquery";
        case LineTokenKind.MultilineComment:
        case LineTokenKind.MultilineCommentContent:
        case LineTokenKind.MultilineCommentEnd:
        case LineTokenKind.MultilineCommentStart:
            return "comment.block.powerquery";
        // Quoted identifiers
        case LineTokenKind.QuotedIdentifierContent:
            return "entity.name.powerquery";
        case LineTokenKind.QuotedIdentifierEnd:
            return "punctuation.definition.quotedidentifier.end.powerquery";
        case LineTokenKind.QuotedIdentifierStart:
            return "punctuation.definition.quotedidentifier.begin.powerquery";
        // Strings
        case LineTokenKind.StringLiteral:
        case LineTokenKind.StringLiteralContent:
            return "string.quoted.double.powerquery";
        case LineTokenKind.StringLiteralEnd:
            return "punctuation.definition.string.end.powerquery";
        case LineTokenKind.StringLiteralStart:
            return "punctuation.definition.string.begin.powerquery";
        // Constructor helpers
        case LineTokenKind.KeywordHashBinary:
        case LineTokenKind.KeywordHashDate:
        case LineTokenKind.KeywordHashDateTime:
        case LineTokenKind.KeywordHashDateTimeZone:
        case LineTokenKind.KeywordHashDuration:
        case LineTokenKind.KeywordHashTable:
        case LineTokenKind.KeywordHashTime:
            return "support.function.constructor.powerquery";
    }

    throw "Unexpected LineTokenKind value";
}