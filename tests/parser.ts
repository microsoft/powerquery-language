import vsctm = require('vscode-textmate');
import { Lexer, Token } from "@microsoft/powerquery-parser";
import { expect } from "chai";
import "mocha";
import * as Shared from "./common";

describe("Compare parser tokens", () => {
    it("Logical", () => {
        const query = "if true then true else false";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Text", () => {
        const query = "\"string one\" & \"string 2\"";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Numbers", () => {
        const query = "1 1.1 5e123 534.1223 2.2e555 -1.3";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Quoted identifier", () => {
        const query = "#\"identifier with spaces\"";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    // TODO: Grammar returns single token (good), but it ends at '.' (bad)
    xit("Identifier", () => {
        const query = "Table.FromRecords";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("simple function", () => {
        const query = "x = () => 1";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    // TODO: duration is flagged as type, but starting # is ignored
    xit("duration constructor", () => {
        const query = "#duration(1,1,1,1)";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    // TODO: PQ parser doesn't handle comments in the same way
    xit("line comment", () => {
        const query = "1; // comment";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    // TODO: PQ parser doesn't handle comments in the same way
    xit("block comment", () => {
        const query = "1 + /* just a comment */ 1";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
});