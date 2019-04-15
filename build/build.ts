import fs = require('fs');
import path = require('path');
import yaml = require('js-yaml');
import plist = require('plist');

enum Language {
    PowerQuery = "PowerQuery"
}

enum Extension {
    TmLanguage = "tmLanguage",
    TmTheme = "tmTheme",
    YamlTmLangauge = "YAML-tmLanguage",
    YamlTmTheme = "YAML-tmTheme"
}

function file(language: Language, extension: Extension) {
    return path.join(__dirname, '..', `${language}.${extension}`);
}

function writePlistFile(grammar: any, fileName: string) {
    const text = plist.build(grammar);
    fs.writeFileSync(fileName, text);
}

function readYaml(fileName: string) {
    const text = fs.readFileSync(fileName, "utf8");
    return yaml.safeLoad(text);
}

function buildGrammar() {
    const grammar = readYaml(file(Language.PowerQuery, Extension.YamlTmLangauge))
    writePlistFile(grammar, file(Language.PowerQuery, Extension.TmLanguage));
}

buildGrammar();