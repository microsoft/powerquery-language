import vsctm = require('vscode-textmate');
import { Lexer, Token } from "powerquery-parser";
import { expect } from "chai";
import "mocha";
import * as Shared from "./common";

const QueryMultiline = `let
    a = 1,
    b = "text",
    c = Text.From(a)
in
    c`;

describe("Incremental parsing", () => {
    it("Simple", () => {
        let grammarState: vsctm.StackElement = null;
        let pqState: Lexer.TLexer = null;
        let lastTokenCount: number = 0;

        let lines = QueryMultiline.split("\n");

        for (let i = 0; i < lines.length; i++) {
            let r = Shared.grammar.tokenizeLine(lines[i], grammarState);
            grammarState = r.ruleStack;

            if (pqState == null) {
                pqState = Lexer.from(lines[i]);
            } else {
                pqState = Lexer.appendToDocument(pqState, lines[i]);
            }

            lastTokenCount = pqState.tokens.length;

            pqState = Lexer.remaining(pqState);

            let gTokens = Shared.TokenComparer.NormalizeGrammarTokens(r.tokens);
            let comparer = new Shared.TokenComparer(gTokens, pqState.tokens.slice(lastTokenCount));

            comparer.assertTokenCount();
            // TODO: PQ offsets are based on document position rather than line position
            // comparer.assertTokenOffsets();
        }
    });

    // TODO: add PQ equivalent
    xit("Multiline string literal", () => {
        const query = "\"multi\nline\nstring\"";

        let grammarState: vsctm.StackElement = null;
        let lines = query.split("\n");

        for (let i = 0; i < lines.length; i++) {
            let r = Shared.grammar.tokenizeLine(lines[i], grammarState);
            grammarState = r.ruleStack;
        }
    });
});