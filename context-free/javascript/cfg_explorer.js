"use strict";
var CFG;
(function (CFG) {
    function findElement(name) {
        const element = document.getElementById(name);
        if (element === null)
            throw `No element "${name}"`;
        return element;
    }
    CFG.findElement = findElement;
    function findInputElement(name) {
        const element = findElement(name);
        if (!(element instanceof HTMLInputElement))
            throw `"${name}" is not an input element`;
        return element;
    }
    CFG.findInputElement = findInputElement;
    function removeChildren(element) {
        while (element.lastChild)
            element.removeChild(element.lastChild);
    }
    CFG.removeChildren = removeChildren;
    function bulletList(items) {
        return compoundElement("ul", items.map((item) => simpleElement("li", item)));
    }
    CFG.bulletList = bulletList;
    function simpleElement(name, content) {
        const element = document.createElement(name);
        element.textContent = content;
        return element;
    }
    CFG.simpleElement = simpleElement;
    function compoundElement(name, children) {
        const element = document.createElement(name);
        for (const child of children)
            element.appendChild(child);
        return element;
    }
    CFG.compoundElement = compoundElement;
})(CFG || (CFG = {}));
var CFG;
(function (CFG) {
    class Grammar {
        constructor() {
            this.lhss = [];
            this.productions = new Map();
        }
        addProduction(lhs, rhs) {
            let entry = this.productions.get(lhs);
            if (entry) {
                entry.push(rhs);
            }
            else {
                this.lhss.push(lhs);
                this.productions.set(lhs, [rhs]);
            }
        }
        getStart() { return this.lhss[0]; }
        nonTerminals() { return this.lhss; }
        isTerminal(sym) { return !this.productions.has(sym); }
        isNonTerminal(sym) { return this.productions.has(sym); }
        expansions(nt) {
            return this.productions.get(nt);
        }
    }
    CFG.Grammar = Grammar;
})(CFG || (CFG = {}));
var CFG;
(function (CFG) {
    class Cons {
        constructor(head, tail) {
            this.head = head;
            this.tail = tail;
        }
    }
    function cons(x) {
        return (xs) => new Cons(x, xs);
    }
    CFG.cons = cons;
    function equalList(eq, xs, ys) {
        while (xs !== null) {
            if (ys === null)
                return false;
            if (xs === ys)
                return true;
            if (!eq(xs.head, ys.head))
                return false;
            xs = xs.tail;
            ys = ys.tail;
        }
        return ys === null;
    }
    CFG.equalList = equalList;
    function elements(list) {
        return {
            [Symbol.iterator]: function* () {
                for (let p = list; p !== null; p = p.tail)
                    yield p.head;
            }
        };
    }
    CFG.elements = elements;
})(CFG || (CFG = {}));
var CFG;
(function (CFG) {
    function attr(n, v) {
        return { name: n, value: v };
    }
    CFG.attr = attr;
    function numAttr(n, v) {
        return { name: n, value: String(v) };
    }
    CFG.numAttr = numAttr;
    function svgElement(name, attrs, children) {
        const e = document.createElementNS("http://www.w3.org/2000/svg", name);
        for (const attr of attrs)
            e.setAttribute(attr.name, attr.value);
        for (const child of children)
            e.appendChild(child);
        return e;
    }
    CFG.svgElement = svgElement;
    function lines(colour, children) {
        return svgElement("g", [
            attr("stroke", colour),
            attr("stroke-width", "1"),
            attr("stroke-linecap", "round")
        ], children);
    }
    CFG.lines = lines;
    function line(x1, y1, x2, y2) {
        return svgElement("line", [
            numAttr("x1", x1),
            numAttr("y1", y1),
            numAttr("x2", x2),
            numAttr("y2", y2)
        ], []);
    }
    CFG.line = line;
    function text(x, y, colour, s) {
        const element = svgElement("text", [
            numAttr("x", x),
            numAttr("y", y),
            attr("text-anchor", "middle"),
            attr("fill", colour)
        ], []);
        element.textContent = s;
        return element;
    }
    CFG.text = text;
})(CFG || (CFG = {}));
var CFG;
(function (CFG) {
    const HSEP = 30;
    const VSEP = 45;
    const STRIP_HEIGHT = 30;
    const TOP = 15;
    const BOTTOM = 5;
    const H_PADDING = 20;
    const V_PADDING = 20;
    const TERM_SYMBOL_COLOUR = "#0000cc";
    const TERM_LINE_COLOUR = "#dddddd";
    const NT_SYMBOL_COLOUR = "#cc0000";
    const NT_LINE_COLOUR = "black";
    const NT_NULL_COLOUR = "#aaaaaa";
    const NT_NULL_SYMBOL = "ε";
    class NonTerminalTree {
        constructor(sym, children) {
            this.sym = sym;
            this.children = children;
            let h = 1;
            let w = 0;
            for (const t of CFG.elements(children)) {
                h = Math.max(h, t.height());
                w = w + t.width();
            }
            this.ht = h + 1;
            this.wd = Math.max(1, w);
            this.sentence = Array.from(CFG.elements(children), (t) => t.getSentence()).join("");
        }
        height() { return this.ht; }
        width() { return this.wd; }
        getSentence() { return this.sentence; }
        nonTerminal() { return this.sym; }
        draw(out, x, y, levels) {
            const ty = y + VSEP;
            let trx = [];
            let tx = x;
            for (const t of CFG.elements(this.children)) {
                trx.push(t.draw(out, tx, ty, levels - 1));
                tx = tx + t.width() * HSEP;
            }
            const n = trx.length;
            const rx = n === 0 ? x :
                (trx[Math.floor((n - 1) / 2)] + trx[Math.floor(n / 2)]) / 2;
            out.push(CFG.text(rx, y, NT_SYMBOL_COLOUR, this.sym));
            const y1 = y + BOTTOM;
            const y2 = ty - TOP;
            if (n === 0) {
                out.push(CFG.text(x, ty, NT_NULL_COLOUR, NT_NULL_SYMBOL));
                out.push(CFG.lines(NT_NULL_COLOUR, [CFG.line(x, y1, x, y2)]));
            }
            else {
                out.push(CFG.lines(NT_LINE_COLOUR, trx.map((cx) => CFG.line(rx, y1, cx, y2))));
            }
            return rx;
        }
    }
    CFG.NonTerminalTree = NonTerminalTree;
    class TerminalTree {
        constructor(sym) {
            this.sym = sym;
        }
        height() { return 1; }
        width() { return 1; }
        getSentence() { return this.sym; }
        draw(out, x, y, levels) {
            out.push(CFG.text(x, y, TERM_SYMBOL_COLOUR, this.sym));
            const ly = y + levels * VSEP - 10;
            out.push(CFG.text(x, ly, TERM_SYMBOL_COLOUR, this.sym));
            out.push(CFG.lines(TERM_LINE_COLOUR, [CFG.line(x, y + BOTTOM, x, ly - TOP)]));
            return x;
        }
    }
    CFG.TerminalTree = TerminalTree;
    function equalTree(t1, t2) {
        if (t1 === t2)
            return true;
        if (t1 instanceof TerminalTree && t2 instanceof TerminalTree)
            return t1.sym === t2.sym;
        if (t1 instanceof NonTerminalTree && t2 instanceof NonTerminalTree)
            return t1.sym === t2.sym &&
                CFG.equalList(equalTree, t1.children, t2.children);
        return false;
    }
    CFG.equalTree = equalTree;
    function compareNTs(a, b) {
        const a_sentence = a.getSentence();
        const b_sentence = b.getSentence();
        if (a_sentence.length !== b_sentence.length)
            return a_sentence.length - b_sentence.length;
        if (a_sentence < b_sentence)
            return -1;
        if (a_sentence > b_sentence)
            return 1;
        return a.height() - b.height();
    }
    CFG.compareNTs = compareNTs;
    function drawTree(t) {
        const box_width = t.width() * HSEP;
        const box_height = t.height() * VSEP;
        let es = [];
        es.push(CFG.svgElement("rect", [
            CFG.numAttr("width", box_width),
            CFG.numAttr("height", box_height),
            CFG.attr("fill", "#fff7db")
        ], []));
        es.push(CFG.svgElement("rect", [
            CFG.numAttr("y", box_height),
            CFG.numAttr("width", box_width),
            CFG.numAttr("height", STRIP_HEIGHT),
            CFG.attr("fill", "#f0e6bc")
        ], []));
        t.draw(es, HSEP / 2, 30, t.height());
        return CFG.svgElement("svg", [
            CFG.numAttr("width", box_width + H_PADDING),
            CFG.numAttr("height", box_height + STRIP_HEIGHT + V_PADDING),
            CFG.attr("xmlns", "http://www.w3.org/2000/svg"),
            CFG.attr("version", "1.1"),
            CFG.attr("font-family", "sans-serif"),
            CFG.numAttr("font-size", 15)
        ], es);
    }
    CFG.drawTree = drawTree;
})(CFG || (CFG = {}));
var CFG;
(function (CFG) {
    class QElement {
        constructor(value) {
            this.value = value;
            this.next = null;
        }
    }
    class Queue {
        constructor() { this.front = this.back = null; }
        isEmpty() { return this.front === null; }
        add(v) {
            if (this.back === null)
                this.back = this.front = new QElement(v);
            else
                this.back = this.back.next = new QElement(v);
        }
        remove() {
            const front = this.front;
            if (front !== null) {
                this.front = front.next;
                if (this.front === null)
                    this.back = null;
                return front.value;
            }
            throw "empty queue";
        }
    }
    CFG.Queue = Queue;
})(CFG || (CFG = {}));
var CFG;
(function (CFG) {
    function precondition(cond) {
        if (!cond)
            throw "precondition does not hold";
    }
    function newArray(n) {
        let arr = [];
        for (let i = 0; i < n; i++)
            arr.push([]);
        return arr;
    }
    function equalArray(a, b) {
        return a === b ||
            a.length === b.length && a.every((v, i) => v === b[i]);
    }
    class EarleyItem {
        constructor(nt, rhs, pos, parsed, finish) {
            this.nt = nt;
            this.rhs = rhs;
            this.pos = pos;
            this.parsed = parsed;
            this.finish = finish;
        }
        advance(t) {
            precondition(!this.finished());
            return new EarleyItem(this.nt, this.rhs, this.pos - 1, CFG.cons(t)(this.parsed), this.finish);
        }
        equals(o) {
            return o === this ||
                this.finish === o.finish && this.pos === o.pos &&
                    this.nt === o.nt && equalArray(this.rhs, o.rhs) &&
                    CFG.equalList(CFG.equalTree, this.parsed, o.parsed);
        }
        finished() { return this.pos === 0; }
        finishedWith(nt) {
            return this.pos === 0 && this.nt === nt;
        }
        match(tsym) {
            return this.pos > 0 && this.rhs[this.pos - 1] === tsym;
        }
        current() {
            precondition(!this.finished());
            return this.rhs[this.pos - 1];
        }
        start() { return this.finish; }
        complete() {
            precondition(this.finished());
            return new CFG.NonTerminalTree(this.nt, this.parsed);
        }
        completeTop() {
            precondition(this.finished());
            if (this.parsed === null)
                throw "requires non-empty list";
            precondition(this.parsed.tail === null);
            return this.parsed.head;
        }
    }
    function endItem(nt, rhs, finish) {
        return new EarleyItem(nt, rhs, rhs.length, null, finish);
    }
    const START = "Start";
    const EXPANSION_LIMIT = 100;
    function parse(grammar, input) {
        let states = newArray(input.length + 1);
        let truncated = false;
        for (let pos = input.length; pos >= 0; pos--) {
            let queue = new CFG.Queue();
            if (pos === input.length) {
                queue.add(endItem(START, [grammar.getStart()], pos));
            }
            else {
                const nextSym = input[pos];
                if (grammar.isTerminal(nextSym)) {
                    const t = new CFG.TerminalTree(nextSym);
                    for (const item of states[pos + 1])
                        if (item.match(nextSym))
                            queue.add(item.advance(t));
                }
            }
            const state = states[pos];
            let empties = [];
            while (!queue.isEmpty()) {
                if (state.length > EXPANSION_LIMIT) {
                    truncated = true;
                    break;
                }
                const item = queue.remove();
                if (!state.some((s) => s.equals(item))) {
                    state.push(item);
                    if (item.finished()) {
                        const t = item.complete();
                        const nt = t.nonTerminal();
                        const end = item.start();
                        if (end === pos)
                            empties.push(t);
                        for (const prev of states[end])
                            if (prev.match(nt))
                                queue.add(prev.advance(t));
                    }
                    else {
                        const nt = item.current();
                        if (grammar.isNonTerminal(nt)) {
                            for (const rhs of grammar.expansions(nt))
                                queue.add(endItem(nt, rhs, pos));
                            for (const t of empties)
                                if (t.nonTerminal() === nt)
                                    queue.add(item.advance(t));
                        }
                    }
                }
            }
            states[pos] = state;
        }
        let trees = [];
        for (const item of states[0])
            if (item.finishedWith(START))
                trees.push(item.completeTop());
        return { complete: !truncated, trees: trees };
    }
    CFG.parse = parse;
})(CFG || (CFG = {}));
var CFG;
(function (CFG) {
    class Expansion {
        constructor(grammar, limit) {
            this.grammar = grammar;
            this.limit = limit;
            this.count = 0;
            this.expandCount = 0;
            this.finished = false;
            this.lgges = new Map();
            for (const nt of grammar.nonTerminals())
                this.lgges.set(nt, []);
        }
        expand() {
            let new_lgges = new Map();
            for (const nt of this.grammar.nonTerminals()) {
                let ts = [];
                for (const rhs of this.grammar.expansions(nt)) {
                    const strs = this.expandSymbols(rhs);
                    for (const str of strs) {
                        const t = new CFG.NonTerminalTree(nt, str);
                        ts.push(t);
                        this.count += t.height() * t.width();
                        if (this.count > this.limit)
                            return false;
                    }
                }
                new_lgges.set(nt, ts);
            }
            let prev_size = this.size();
            this.lgges = new_lgges;
            this.expandCount++;
            if (this.size() === prev_size)
                this.finished = true;
            return true;
        }
        expandSymbols(syms) {
            let strs = [null];
            for (let i = syms.length - 1; i >= 0; i--)
                strs = this.expandSymbol(syms[i], strs);
            return strs;
        }
        expandSymbol(sym, strs) {
            if (this.grammar.isTerminal(sym)) {
                const t = new CFG.TerminalTree(sym);
                return strs.map(CFG.cons(t));
            }
            else {
                const exps = this.lgges.get(sym);
                let new_strs = [];
                for (const t of exps)
                    for (const str of strs)
                        new_strs.push(CFG.cons(t)(str));
                return new_strs;
            }
        }
        expandToDepth(maxDepth) {
            while (this.expandCount < maxDepth &&
                !this.finished && this.expand())
                ;
        }
        derivations(nt) {
            return this.lgges.get(nt);
        }
        depth() { return this.expandCount; }
        size() {
            let n = 0;
            for (const nt of this.grammar.nonTerminals())
                n = n + this.derivations(nt).length;
            return n;
        }
        complete() { return this.finished; }
    }
    CFG.Expansion = Expansion;
})(CFG || (CFG = {}));
var CFG;
(function (CFG) {
    function addAll(s, vs) {
        for (const v of vs)
            s.add(v);
    }
    function transitiveClose(rel) {
        let changed = true;
        while (changed) {
            changed = false;
            for (const ys of rel.values()) {
                const ysClone = Array.from(ys);
                for (const target of ysClone) {
                    const extra = rel.get(target);
                    if (extra)
                        addAll(ys, extra);
                }
                if (ys.size > ysClone.length)
                    changed = true;
            }
        }
    }
    function identities(rel) {
        let cyclic = new Set();
        for (const [x, ys] of rel.entries())
            if (ys.has(x))
                cyclic.add(x);
        return cyclic;
    }
    class GrammarProperties {
        constructor(grammar) {
            this.grammar = grammar;
            this.unreachable = this.computeUnreachable();
            this.unrealizable = this.computeUnrealizable();
            this.nullable = this.computeNullable();
            this.cyclic = this.computeCyclic();
        }
        getUnreachable() { return this.unreachable; }
        getUnrealizable() { return this.unrealizable; }
        getNullable() { return this.nullable; }
        getCyclic() { return this.cyclic; }
        infinitelyAmbiguous() {
            for (const nt of this.cyclic)
                if (!this.unreachable.has(nt) &&
                    !this.unrealizable.has(nt))
                    return true;
            return false;
        }
        computeUnreachable() {
            let reachable = new Set();
            let queue = new CFG.Queue();
            queue.add(this.grammar.getStart());
            while (!queue.isEmpty()) {
                const nt = queue.remove();
                if (!reachable.has(nt)) {
                    reachable.add(nt);
                    for (const rhs of this.grammar.expansions(nt))
                        for (const sym of rhs)
                            if (this.grammar.isNonTerminal(sym))
                                queue.add(sym);
                }
            }
            return this.complement(reachable);
        }
        computeUnrealizable() {
            let unrealizable = new Set(this.grammar.nonTerminals());
            function realizableRhs(rhs) {
                return rhs.every((sym) => !unrealizable.has(sym));
            }
            ;
            let changed = true;
            while (changed) {
                changed = false;
                for (const nt of unrealizable)
                    if (this.grammar.expansions(nt).some(realizableRhs)) {
                        unrealizable.delete(nt);
                        changed = true;
                        break;
                    }
            }
            return unrealizable;
        }
        computeNullable() {
            let nullable = new Set();
            function nullableRhs(rhs) {
                return rhs.every((sym) => nullable.has(sym));
            }
            ;
            let changed = true;
            while (changed) {
                changed = false;
                for (const nt of this.grammar.nonTerminals())
                    if (!nullable.has(nt) &&
                        this.grammar.expansions(nt).some(nullableRhs)) {
                        nullable.add(nt);
                        changed = true;
                        break;
                    }
            }
            return nullable;
        }
        computeCyclic() {
            let expansion = this.directExpansion();
            transitiveClose(expansion);
            return identities(expansion);
        }
        directExpansion() {
            let expansion = new Map();
            for (const nt of this.grammar.nonTerminals()) {
                let s = new Set();
                for (const rhs of this.grammar.expansions(nt)) {
                    let nonNullCount = 0;
                    for (let sym of rhs)
                        if (!this.nullable.has(sym))
                            nonNullCount++;
                    if (nonNullCount === 0)
                        addAll(s, rhs);
                    else if (nonNullCount === 1)
                        for (const sym of rhs)
                            if (this.grammar.isNonTerminal(sym) &&
                                !this.nullable.has(sym))
                                s.add(sym);
                }
                if (s.size !== 0)
                    expansion.set(nt, s);
            }
            return expansion;
        }
        complement(s) {
            let rest = new Set();
            for (const nt of this.grammar.nonTerminals())
                if (!s.has(nt))
                    rest.add(nt);
            return rest;
        }
    }
    CFG.GrammarProperties = GrammarProperties;
})(CFG || (CFG = {}));
var CFG;
(function (CFG) {
    const LIMIT = 10000;
    class GrammarExplorer {
        constructor(rules, errors, gallery) {
            this.rules = rules.map(ruleSources);
            this.errors = CFG.findElement(errors);
            this.gallery = CFG.findElement(gallery);
            const action = (e) => {
                if (e.keyCode == 13)
                    this.allDerivations();
            };
            for (const rule of this.rules)
                rule.rhs.onkeydown = action;
        }
        getGrammar() {
            let grammar = new CFG.Grammar();
            for (const rule of this.rules) {
                const lhs = rule.lhs.value;
                const rhs = rule.rhs.value;
                if (lhs !== "")
                    for (const prod of parseRHS(rhs))
                        grammar.addProduction(lhs, prod);
            }
            return grammar;
        }
        reportIssues(issues) {
            CFG.removeChildren(this.errors);
            if (issues.length > 0) {
                this.errors.appendChild(CFG.simpleElement("p", "This grammar has the following problems:"));
                this.errors.appendChild(CFG.bulletList(issues));
            }
        }
        setTreeGallery(caption, trees) {
            const target = this.gallery;
            CFG.removeChildren(target);
            target.appendChild(CFG.simpleElement("h2", caption));
            trees.sort(CFG.compareNTs);
            for (const tree of trees)
                target.appendChild(CFG.drawTree(tree));
        }
        allDerivations() {
            const grammar = this.getGrammar();
            this.reportIssues(grammarIssues(grammar));
            const maxDepth = grammar.nonTerminals().length + 9;
            const lgges = new CFG.Expansion(grammar, LIMIT);
            lgges.expandToDepth(maxDepth);
            const trees = lgges.derivations(grammar.getStart());
            const caption = lgges.complete() ? "All derivation trees" :
                "Derivation trees of depth at most " + lgges.depth();
            this.setTreeGallery(caption, trees);
        }
    }
    CFG.GrammarExplorer = GrammarExplorer;
    function ruleSources([lhs, rhs]) {
        return { lhs: CFG.findInputElement(lhs), rhs: CFG.findInputElement(rhs) };
    }
    class SentenceParser {
        constructor(grammarSrc, sentence) {
            this.grammarSrc = grammarSrc;
            this.sentence = CFG.findInputElement(sentence);
            this.sentence.onkeydown = (e) => {
                if (e.keyCode == 13)
                    this.deriveSentence();
            };
        }
        deriveSentence() {
            const grammar = this.grammarSrc.getGrammar();
            this.grammarSrc.reportIssues(grammarIssues(grammar));
            const sentence = this.sentence.value;
            const result = CFG.parse(grammar, symList(sentence));
            const caption = (!result.complete ? "Some of the derivations" :
                result.trees.length == 0 ? "There are no derivations" :
                    result.trees.length == 1 ? "Derivation tree" :
                        "Derivation trees") + " for '" + sentence + "'";
            this.grammarSrc.setTreeGallery(caption, result.trees);
        }
    }
    CFG.SentenceParser = SentenceParser;
    function parseRHS(rhs) {
        return rhs.split("|").map(symList);
    }
    function symList(s) {
        return Array.from(s).filter((c) => c !== ' ');
    }
    function grammarIssues(g) {
        const properties = new CFG.GrammarProperties(g);
        let issues = [];
        const unreachable = properties.getUnreachable();
        const unrealizable = properties.getUnrealizable();
        const cyclic = properties.getCyclic();
        if (unreachable.size > 0)
            issues.push(describeNTs(unreachable, "unreachable from the start symbol " + g.getStart()));
        if (unrealizable.size > 0)
            issues.push(describeNTs(unrealizable, "unrealizable (cannot generate any strings)"));
        if (cyclic.size > 0)
            issues.push(describeNTs(cyclic, properties.infinitelyAmbiguous() ?
                "cyclic, so some strings have infinitely many derivations" : "cyclic"));
        return issues;
    }
    function describeNTs(nts, adjective) {
        const plural = nts.size > 1;
        return (plural ? "Nonterminals " : "Nonterminal ") +
            Array.from(nts).join(", ") +
            (plural ? " are " : " is ") +
            adjective + ".";
    }
})(CFG || (CFG = {}));
