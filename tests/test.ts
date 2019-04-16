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

class SingleLineTokenComparer {
    public grammarTokens: vsctm.IToken[];
    public parserTokens: readonly Token[]

    constructor(query: string, normalize: boolean = true) {
        let pqlex: Lexer.TLexer = Lexer.from(query);
        pqlex = Lexer.remaining(pqlex);                
        this.parserTokens = pqlex.tokens;        

        // remove whitespace tokens from grammar result
        let r = grammar.tokenizeLine(query, null);

        this.grammarTokens = normalize ? SingleLineTokenComparer.NormalizeGrammarTokens(r.tokens) : r.tokens;

        expect(this.parserTokens.length).greaterThan(0);
        expect(this.grammarTokens.length).greaterThan(0);
    }

    public assertTokenCount() {
        expect(this.parserTokens.length).equals(this.grammarTokens.length, "token counts are not equal");
    }

    public assertTokenOffsets() {
        for (let i = 0; i < this.parserTokens.length; i++) {
            const pt = this.parserTokens[i];
            const gt = this.grammarTokens[i];

            expect(pt.documentStartIndex).eq(gt.startIndex);
            expect(pt.documentEndIndex).eq(gt.endIndex);
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
            if (token.scopes.includes(QuoteStringBeginScope)) {
                var startIndex = token.startIndex;

                // next token should be string
                var stringToken = tokens[++i];
                var scopes = stringToken.scopes;

                // final token should be end quote
                var endToken = tokens[++i];
                var endIndex = endToken.endIndex;

                // sanity
                expect(scopes).contains(StringScope, "middle token should be a string");
                expect(endToken.scopes).contains(QuoteStringEndScope, "third token should be end quote");

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

describe("Basic grammar tests", () => {
    it("Grammar loaded", () => {
        expect(grammar).to.exist;
    }),

    it("Tokens", () => {
        const code = `let
    a = 1,
    b = "text",
    c = Text.From(a)
in
    c`;

        let state = null;
        let lines = code.split("\n");

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
    })
});