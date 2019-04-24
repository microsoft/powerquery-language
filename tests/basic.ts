import { expect } from "chai";
import "mocha";
import * as Shared from "./common";

// Query constants
const QueryMultiline = `let
    a = 1,
    b = "text",
    c = Text.From(a)
in
    c`;

describe("Basic grammar tests", () => {
    it("Grammar loaded", () => {
        expect(Shared.grammar).to.exist;
    });

    it("Tokens", () => {
        let state = null;
        let lines = QueryMultiline.split("\n");

        for (let i = 0; i < lines.length; i++) {
            let r = Shared.grammar.tokenizeLine(lines[i], state);
            state = r.ruleStack;
            expect(r.tokens.length).to.be.greaterThan(0);
        }
    });
});