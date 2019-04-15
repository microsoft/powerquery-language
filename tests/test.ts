import fs = require('fs');
import path = require('path');
import vsctm = require('vscode-textmate');
import { expect } from "chai";
import "mocha";

function getGrammarFilePath(): string {
    return path.join(__dirname, '..', "PowerQuery.tmLanguage");
}

const registry = new vsctm.Registry();
const grammar = registry.loadGrammarFromPathSync(getGrammarFilePath());

describe("Test if this works", () => {
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
            expect(r.tokens.length).greaterThan(0);
            state = r.ruleStack;
        }
    });
});