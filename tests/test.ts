import path = require('path');
import vsctm = require('vscode-textmate');
import { expect } from "chai";
import "mocha";

function getGrammarFilePath(): string {
    return path.join(__dirname, '..', "PowerQuery.tmLanguage");
}

const registry = new vsctm.Registry();
const grammar = registry.loadGrammarFromPathSync(getGrammarFilePath());

describe("Basic grammar tests", () => {
    it("Grammar loaded", () => {
        expect(grammar).is.not.null.and.is.not.undefined;
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