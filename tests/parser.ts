import vsctm = require('vscode-textmate');
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
    it("With escaped text", () => {
        const query = "\"with  \"\"escaped \"\" 'text\"";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Numbers", () => {
        const query = "1 1.1 5e123 534.1223 2.2e555 -1.3";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Numeric expression", () => {
        const query = "5 / 1.2e+2 + 0x1234abc";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Quoted identifier", () => {
        const query = "#\"identifier with spaces\"";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Quoted identifier (no space)", () => {
        const query = "#\"identifier\"";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    // TODO: Grammar returns single token (good), but it ends at '.' (bad)
    xit("Identifier", () => {
        const query = "Table.FromRecords";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Simple function", () => {
        const query = "x = () => 1";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Duration constructor", () => {
        const query = "#duration(1,1,1,1)";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Line comment", () => {
        const query = "1; // comment";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Block comment", () => {
        const query = "1 + /* just a comment */ 1";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Exception flow", () => {
        const query = "try true otherwise error \"error text\"";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    it("Escaped identifier and step", () => {
        const query = "#\"A  B\" = 1+2,";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    xit("Case sensitivity for keywords", () => {
        const query = "And as Each each _";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    xit("Section header", () => {
        const query = "[Version=\"1.0.1\"] section Foo; shared Member.Name = 1;";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });
    xit("Recursion", () => {
        const query = "@RecursiveFunction()+@Rec.Func()";
        const r = new Shared.SingleLineTokenComparer(query);
        r.assertSame();
    });    
});