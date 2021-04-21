"use strict";
var IterableUtils;
(function (IterableUtils) {
    function iterable(maker) {
        return { [Symbol.iterator]: maker };
    }
    function iterator(xs) {
        return xs[Symbol.iterator]();
    }
    function map(f) {
        return function (xs) {
            return iterable(function* () {
                for (const x of xs)
                    yield f(x);
            });
        };
    }
    IterableUtils.map = map;
    function drop(n, xs) {
        return iterable(function* () {
            let px = iterator(xs);
            for (let i = 0; i < n; i++)
                if (px.next().done)
                    return;
            for (let rx = px.next(); !rx.done; rx = px.next())
                yield rx.value;
        });
    }
    IterableUtils.drop = drop;
    function foldl(f, z) {
        return function (xs) {
            let y = z;
            for (const x of xs)
                y = f(x, y);
            return y;
        };
    }
    IterableUtils.foldl = foldl;
    function concat(xss) {
        return iterable(function* () {
            for (const xs of xss)
                yield* xs;
        });
    }
    IterableUtils.concat = concat;
    function longZipWith(f) {
        return function (xs, ys) {
            return iterable(function* () {
                let px = iterator(xs);
                let py = iterator(ys);
                let rx = px.next();
                let ry = py.next();
                while (!rx.done || !ry.done) {
                    if (rx.done) {
                        yield ry.value;
                        ry = py.next();
                    }
                    else if (ry.done) {
                        yield rx.value;
                        rx = px.next();
                    }
                    else {
                        yield f(rx.value, ry.value);
                        rx = px.next();
                        ry = py.next();
                    }
                }
            });
        };
    }
    IterableUtils.longZipWith = longZipWith;
    function diagonalsWith(f) {
        return function (xs, ys) {
            return iterable(function* () {
                let px = iterator(xs);
                let py = iterator(ys);
                let rx = px.next();
                let ry = py.next();
                let x_arr = [];
                let y_arr = [];
                for (let n = 0;; n++) {
                    if (!rx.done)
                        x_arr.push(rx.value);
                    if (!ry.done)
                        y_arr.push(ry.value);
                    const lo = Math.max(0, n - y_arr.length + 1);
                    const hi = Math.min(n, x_arr.length - 1);
                    if (lo > hi)
                        return;
                    yield map((i) => f(x_arr[i], y_arr[n - i]))(range(lo, hi));
                    if (!rx.done)
                        rx = px.next();
                    if (!ry.done)
                        ry = py.next();
                }
            });
        };
    }
    IterableUtils.diagonalsWith = diagonalsWith;
    function mergeWith(compare, xs, ys) {
        return iterable(function* () {
            let px = iterator(xs);
            let py = iterator(ys);
            let rx = px.next();
            let ry = py.next();
            while (!rx.done && !ry.done) {
                const comp = compare(rx.value, ry.value);
                if (comp === 0) {
                    yield rx.value;
                    rx = px.next();
                    ry = py.next();
                }
                else if (comp < 0) {
                    yield rx.value;
                    rx = px.next();
                }
                else {
                    yield ry.value;
                    ry = py.next();
                }
            }
            if (rx.done)
                while (!ry.done) {
                    yield ry.value;
                    ry = py.next();
                }
            else
                while (!rx.done) {
                    yield rx.value;
                    rx = px.next();
                }
        });
    }
    IterableUtils.mergeWith = mergeWith;
    function cons(x, xs) {
        return iterable(function* () {
            yield x;
            yield* xs;
        });
    }
    IterableUtils.cons = cons;
    function range(start, finish, step = 1) {
        return iterable(function* () {
            if (step > 0)
                for (let i = start; i <= finish; i += step)
                    yield i;
            else if (step < 0)
                for (let i = start; i >= finish; i += step)
                    yield i;
        });
    }
    IterableUtils.range = range;
    let LinkType;
    (function (LinkType) {
        LinkType[LinkType["Hole"] = 0] = "Hole";
        LinkType[LinkType["End"] = 1] = "End";
        LinkType[LinkType["Cons"] = 2] = "Cons";
    })(LinkType || (LinkType = {}));
    ;
    function* sharingIterator(cursor, xp) {
        for (;;) {
            if (cursor.linkType === LinkType.Hole) {
                const rx = xp.next();
                if (rx.done)
                    cursor.linkType = LinkType.End;
                else {
                    cursor.linkType = LinkType.Cons;
                    cursor.value = rx.value;
                    cursor.next = { linkType: LinkType.Hole };
                }
            }
            if (cursor.linkType === LinkType.End)
                return;
            const result = cursor.value;
            cursor = cursor.next;
            yield result;
        }
    }
    function share(xp) {
        const values = { linkType: LinkType.Hole };
        return iterable(() => sharingIterator(values, xp));
    }
    IterableUtils.share = share;
    function once(xs) {
        return share(iterator(xs));
    }
    IterableUtils.once = once;
    function fixpoint(f) {
        const xs = once(iterable(function* () { yield* f(xs); }));
        return xs;
    }
    IterableUtils.fixpoint = fixpoint;
})(IterableUtils || (IterableUtils = {}));
var Regex;
(function (Regex) {
    var Iter = IterableUtils;
    Regex.strings = Iter.concat;
    Regex.emptyString = [[""]];
    function singleLetter(c) { return [[], [c]]; }
    Regex.singleLetter = singleLetter;
    Regex.unionLangs = Iter.longZipWith(union);
    function catLangs(l1, l2) {
        return Iter.map(unions)(Iter.diagonalsWith(append)(l1, l2));
    }
    Regex.catLangs = catLangs;
    function starLang(l) {
        return Iter.fixpoint((l_star) => Iter.cons([""], catLangs(Iter.drop(1, l), l_star)));
    }
    Regex.starLang = starLang;
    function append(xs, ys) {
        return unions(Iter.map((x) => ys.map((y) => x + y))(xs));
    }
    const unions = Iter.foldl(union, []);
    function union(xs, ys) {
        return Array.from(Iter.mergeWith(compareString, xs, ys));
    }
    function compareString(x, y) {
        return x < y ? -1 : x === y ? 0 : 1;
    }
})(Regex || (Regex = {}));
var Regex;
(function (Regex) {
    class CharScanner {
        constructor(str) {
            this.str = str;
            this.pos = 0;
        }
        get() {
            return this.pos < this.str.length ?
                this.str.charAt(this.pos) : '';
        }
        advance() {
            if (this.pos < this.str.length)
                this.pos++;
        }
        fail(msg) {
            throw msg;
        }
        match(t) {
            const c = this.get();
            if (c !== t)
                this.fail(`'${c}' found when expecting '${t}'`);
            this.advance();
        }
    }
    Regex.CharScanner = CharScanner;
    function isAlphaNum(c) {
        return 'a' <= c && c <= 'z' || 'A' <= c && c <= 'Z' ||
            '0' <= c && c <= '9';
    }
    Regex.isAlphaNum = isAlphaNum;
})(Regex || (Regex = {}));
var Regex;
(function (Regex) {
    function emptyExpr() { return new EmptyExpr(); }
    Regex.emptyExpr = emptyExpr;
    function singleExpr(c) { return new SingleExpr(c); }
    Regex.singleExpr = singleExpr;
    function orExpr(e1, e2) {
        return new OrExpr(e1, e2);
    }
    Regex.orExpr = orExpr;
    function andExpr(e1, e2) {
        return new AndExpr(e1, e2);
    }
    Regex.andExpr = andExpr;
    function starExpr(e) { return new StarExpr(e); }
    Regex.starExpr = starExpr;
    function foldRegExpr(alts) {
        return function fold(re) {
            return re.cases({
                emptyExpr: () => alts.emptyExpr(),
                singleExpr: (c) => alts.singleExpr(c),
                orExpr: (e1, e2) => alts.orExpr(fold(e1), fold(e2)),
                andExpr: (e1, e2) => alts.andExpr(fold(e1), fold(e2)),
                starExpr: (e) => alts.starExpr(fold(e))
            });
        };
    }
    Regex.foldRegExpr = foldRegExpr;
    class EmptyExpr {
        constructor() { }
        cases(alts) { return alts.emptyExpr(); }
    }
    class SingleExpr {
        constructor(c) {
            this.c = c;
        }
        cases(alts) {
            return alts.singleExpr(this.c);
        }
    }
    ;
    class OrExpr {
        constructor(e1, e2) {
            this.e1 = e1;
            this.e2 = e2;
        }
        cases(alts) {
            return alts.orExpr(this.e1, this.e2);
        }
    }
    class AndExpr {
        constructor(e1, e2) {
            this.e1 = e1;
            this.e2 = e2;
        }
        cases(alts) {
            return alts.andExpr(this.e1, this.e2);
        }
    }
    class StarExpr {
        constructor(e) {
            this.e = e;
        }
        cases(alts) {
            return alts.starExpr(this.e);
        }
    }
})(Regex || (Regex = {}));
var Regex;
(function (Regex) {
    function success(v) { return new Success(v); }
    Regex.success = success;
    function failure(e) { return new Failure(e); }
    Regex.failure = failure;
    class Success {
        constructor(v) {
            this.v = v;
        }
        cases(alts) {
            return alts.success(this.v);
        }
    }
    class Failure {
        constructor(e) {
            this.e = e;
        }
        cases(alts) {
            return alts.failure(this.e);
        }
    }
})(Regex || (Regex = {}));
var Regex;
(function (Regex) {
    function parseRegExpr(s) {
        let scanner = new Regex.CharScanner(s);
        try {
            const e = expr(scanner);
            if (scanner.get() !== '')
                scanner.fail(`unexpected '${scanner.get()}'`);
            return Regex.success(e);
        }
        catch (err) {
            return Regex.failure(err);
        }
    }
    Regex.parseRegExpr = parseRegExpr;
    function expr(scanner) {
        let e = term(scanner);
        while (scanner.get() === '|') {
            scanner.advance();
            e = Regex.orExpr(e, term(scanner));
        }
        return e;
    }
    function term(scanner) {
        let t = Regex.emptyExpr();
        let c = scanner.get();
        while (c === '(' || Regex.isAlphaNum(c) || c === 'ε') {
            t = Regex.andExpr(t, factor(scanner));
            c = scanner.get();
        }
        return t;
    }
    function factor(scanner) {
        let c = scanner.get();
        let f;
        if (Regex.isAlphaNum(c)) {
            f = Regex.singleExpr(c);
            scanner.advance();
        }
        else if (c === '(') {
            scanner.advance();
            f = expr(scanner);
            scanner.match(')');
        }
        else if (c === 'ε') {
            f = Regex.emptyExpr();
            scanner.advance();
        }
        else {
            scanner.fail("letter or '(' expected");
        }
        c = scanner.get();
        while (c === '*') {
            f = Regex.starExpr(f);
            scanner.advance();
            c = scanner.get();
        }
        return f;
    }
})(Regex || (Regex = {}));
var Regex;
(function (Regex) {
    function regexAndLanguage(source, target) {
        const src_element = findElement(source);
        if (!(src_element instanceof HTMLInputElement))
            throw (`"${source}" is not an input element`);
        const tgt_element = findElement(target);
        src_element.onkeydown = function (e) {
            if (e.keyCode == 13)
                setRegexLanguage(tgt_element, src_element.value);
        };
    }
    Regex.regexAndLanguage = regexAndLanguage;
    function regexLanguage(element_id, re_text) {
        setRegexLanguage(findElement(element_id), re_text);
    }
    Regex.regexLanguage = regexLanguage;
    function setRegexLanguage(element, re_text) {
        Regex.parseRegExpr(re_text).cases({
            success: function (e) {
                element.textContent = languageString(e);
            },
            failure: function (msg) {
                removeChildren(element);
                element.appendChild(errorMessage("Malformed expression: " + msg));
            }
        });
    }
    function findElement(id) {
        const element = document.getElementById(id);
        if (element === null)
            throw ("No element " + id);
        return element;
    }
    function removeChildren(element) {
        while (element.lastChild)
            element.removeChild(element.lastChild);
    }
    Regex.removeChildren = removeChildren;
    function errorMessage(msg) {
        const element = document.createElement("em");
        element.setAttribute("class", "error");
        element.textContent = msg;
        return element;
    }
    const LANG_LIMIT = 150;
    function languageString(e) {
        let n = LANG_LIMIT;
        let ss = [];
        for (const s of Regex.strings(language(e))) {
            n -= s.length + 2;
            if (n < 0) {
                ss.push("...");
                break;
            }
            ss.push(s);
        }
        if (ss[0] === "")
            ss[0] = "ε";
        return "{ " + ss.join(", ") + " }";
    }
    const language = Regex.foldRegExpr({
        emptyExpr: () => Regex.emptyString,
        singleExpr: Regex.singleLetter,
        orExpr: Regex.unionLangs,
        andExpr: Regex.catLangs,
        starExpr: Regex.starLang
    });
})(Regex || (Regex = {}));
var regexAndLanguage = Regex.regexAndLanguage;
var regexLanguage = Regex.regexLanguage;
