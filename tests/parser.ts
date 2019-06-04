import "mocha";
import { SingleLineTokenComparer } from "./common";

function compare(expression: string) {
    const r = new SingleLineTokenComparer(expression);
    r.assertSame();
}

describe("Compare parser tokens", () => {
    it("Logical", () => compare('if true then true else false'));
    it("Text", () => compare('"string one" & "string 2"'));
    it("With escaped text", () => compare('"with  ""escaped "" \'text\'"'));
    it("Numbers", () => compare("1 1.1 5e123 534.1223 2.2e555 -1.3"));
    it("Numeric expression", () => compare("5 / 1.2e+2 + 0x1234abc"));
    it("Quoted identifier", () => compare('#"identifier with spaces"'));
    it("Quoted identifier (no space)", () => compare('#"identifier"'));
    it("Simple function", () => compare("x = () => 1"));
    it("Duration constructor", () => compare("#duration(1,1,1,1)"));
    it("Line comment", () => compare("1; // comment"));
    it("Block comment", () => compare("1 + /* just a comment */ 1"));
    it("Exception flow", () => compare('try true otherwise error "error text"'));
    it("Escaped identifier and step", () => compare('#"A  B" = 1+2,'));
    it("Case sensitivity for keywords", () => compare("And as Each each A"));
    it("Section header", () => compare('[version="1.0.1"] section Foo; shared Member = 1;'));
    it("Special character identifiers (single)", () => compare('let ö = 1 in ö'));
    it("Special character identifiers (mixed)", () => compare('let övar1ἓἓ = 1 in övar1ἓἓ'));
    it("Identifier with dot", () => compare("Table.FromRecords"));
    // original regex we want to check - '[^\`\~\!\@\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|;:\'\"\,\<\>\/\?\s]+'
    it("Non-identifier characters as valid separators", () => {
        const separators = ['&', '<>', '<', '>', '*', '+', '/', '-', '=', '>=', '<=', ','];
        separators.forEach(c => {
            compare("ident1" + c + "ident2");
        });
    });
    it("Non-identifier characters", () => {
        const separators = ['!', '~', '`', '%', ';', ':', '(a)', '|', '?', '\\', "'"];
        separators.forEach(c => {
            compare("ident1" + c);
        });
    });
    //
    // Failing tests
    //

    // token is reported as storage.type rather than identifier
    // not sure what the correct behavior is
    xit("Record field", () => compare("record[field]"));
    xit("List access", () => compare("list{0}"));
    
    //
    // Needs investigation
    //
    xit("Recursion", () => compare("@RecursiveFunction()+@Rec.Func()"));
    xit("Default row identifier", () => compare("each _"));
    xit("Function invoke", () => compare('Text.ToBinary("123", BinaryEncoding.Base64)'));
    xit("Table type", () => compare('type table [a = type text, b = type number]'));
});