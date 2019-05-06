import "mocha";
import * as Shared from "./common";

describe("Compare parser tokens", () => {
    it("Logical", () => Shared.Compare("if true then true else false"));
    it("Text", () => Shared.Compare("\"string one\" & \"string 2\""));
    it("With escaped text", () => Shared.Compare("\"with  \"\"escaped \"\" 'text\""));
    it("Numbers", () => Shared.Compare("1 1.1 5e123 534.1223 2.2e555 -1.3"));
    it("Numeric expression", () => Shared.Compare("5 / 1.2e+2 + 0x1234abc"));
    it("Quoted identifier", () => Shared.Compare("#\"identifier with spaces\""));
    it("Quoted identifier (no space)", () => Shared.Compare("#\"identifier\""));
    it("Simple function", () => Shared.Compare("x = () => 1"));
    it("Duration constructor", () => Shared.Compare("#duration(1,1,1,1)"));
    it("Line comment", () => Shared.Compare("1; // comment"));
    it("Block comment", () => Shared.Compare("1 + /* just a comment */ 1"));
    it("Exception flow", () => Shared.Compare("try true otherwise error \"error text\""));
    it("Escaped identifier and step", () => Shared.Compare("#\"A  B\" = 1+2,"));
    // TODO: Grammar returns single token (good), but it ends at '.' (bad)
    xit("Identifier", () => Shared.Compare("Table.FromRecords"));    
    xit("Case sensitivity for keywords", () => Shared.Compare("And as Each each _"));
    xit("Section header", () => Shared.Compare("[Version=\"1.0.1\"] section Foo; shared Member.Name = 1;"));
    xit("Recursion", () => Shared.Compare("@RecursiveFunction()+@Rec.Func()"))
});