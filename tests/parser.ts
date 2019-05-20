import "mocha";
import { SingleLineTokenComparer } from "./common";

function compare(expression: string) {
    const r = new SingleLineTokenComparer(expression);
    r.assertSame();
}

describe("Compare parser tokens", () => {
    it("Logical", () => compare("if true then true else false"));
    it("Text", () => compare("\"string one\" & \"string 2\""));
    it("With escaped text", () => compare("\"with  \"\"escaped \"\" 'text\""));
    it("Numbers", () => compare("1 1.1 5e123 534.1223 2.2e555 -1.3"));
    it("Numeric expression", () => compare("5 / 1.2e+2 + 0x1234abc"));
    it("Quoted identifier", () => compare("#\"identifier with spaces\""));
    it("Quoted identifier (no space)", () => compare("#\"identifier\""));
    it("Simple function", () => compare("x = () => 1"));
    it("Duration constructor", () => compare("#duration(1,1,1,1)"));
    it("Line comment", () => compare("1; // comment"));
    it("Block comment", () => compare("1 + /* just a comment */ 1"));
    it("Exception flow", () => compare("try true otherwise error \"error text\""));
    it("Escaped identifier and step", () => compare("#\"A  B\" = 1+2,"));
    it("Case sensitivity for keywords", () => compare("And as Each each A"));
    it("Section header", () => compare("[Version=\"1.0.1\"] section Foo; shared Member = 1;"));
    // TODO: Grammar returns single token (good), but it ends at '.' (bad)
    xit("Identifier", () => compare("Table.FromRecords"));
    xit("Recursion", () => compare("@RecursiveFunction()+@Rec.Func()"))
});