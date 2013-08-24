/**
 * @author Anurag Gautam
 * @version 0.9b
 */
var lastState = null;
var lastCaretPos = 0;
var modified = false;
var lastModificationNullified = false;


/**
 * @see http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
 */
$.fn.setCursorPosition = function(pos) {
    this.each(function(index, elem) {
        if (elem.setSelectionRange) {
            elem.setSelectionRange(pos, pos);
        } else if (elem.createTextRange) {
            var range = elem.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    });
    return this;
};

var tokenMap = {
    "4": "for", "thr": "there", "d": "the", "cud": "could", "u": "you", "r": "are",
    "thn": "then", "i": "I", "ws": "was", "wsnt": "wasn't", "v": "we", "fucking": "f*****g",
    "fukin": "f***n", "gona": "gonna", "fr": "for", "2": "to", "dat": "that", "nd": "and",
    "fuck": "f**k", "shd": "should", "shud": "should", "shld": "should", "nce": "once", "cnt": "can't",
    "gud": "good", "nyt": "night", "nite": "night", "gn": "good night", "tc": "take care",
    "gm": "good morning", "shit": "$%&t", "hm": "hmm", "nt": "not", "ty": "thankyou", "by": "bye",
    "jst": "just", "c": "see", "cnct": "contact", "y": "why", "k": "okay", "kk": "okay",
    "dis": "this", "rthr": "rather", "sy": "say", "??": "what happened?", "brb": "be right back",
    "bt": "but", "abt": "about", "hve": "have", "ve": "have", "b": "be", "wat": "what", "f9": "fine",
    "im": "I'm", "gt": "get", "yt": "yet", "nvr": "never", "b4": "before", "dy": "day", "cn": "can",
    "f": "of", "fb": "Facebook", "m": "am", "hw": "how", "wtf": "what the fuck", "gr8": "great",
    "2day": "today", "2nite": "tonight", "afaik": "as far as I know", "2l8": "too late",
    "3sum": "threesome", "awsme": "awsome", "1nce": "once", "mob": "mobile", "btw": "by the way",
    "gf": "girlfreind", "ph": "phone", "no.": "number", "phn": "phone no.", "coz": "because",
    "bcoz": "because", "g2g": "get to gather", "l8r": "later", "l8": "late", "latr": "later",
    "luv": "love", "lve": "love", "ilu": "I love you", "nyc": "nice", "njoy": "enjoy", "ol": "online",
    "google": "search", "ru": "are you", "ta": "thanks again", "sum1": "someone", "som1": "someone",
    "sm1": "someone", "thanq": "thankyou", "wt": "what", "ur": "you are", "t+": "think positive",
    "n": "and", "gtg": "gotta go", "agn": "again", "bitch": "b!^(#",
    "frm": "from", "hd":"had", "wen":"when", "whn":"when", "ech":"each",
    "thm":"them", "hr":"her", "luk":"look","nythng":"anything",
    "frst":"first","2nd":"second","tym":"time","fyn":"fine","prt":"part"
};
// Compute the edit distance between the two given strings
getEditDistance = function(a, b) {
    if (a.length === 0)
        return b.length;
    if (b.length === 0)
        return a.length;

    var matrix = [];

    // increment along the first column of each row
    var i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    var j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1)); // deletion
            }
        }
    }

    return matrix[b.length][a.length];
};
//var wordList = [];

getClosestMatch = function(tok, threshold) {
    var i;
    var match = tok, score = tok.length;
//    console.log("Wordlist=>",wordList.length);
    for (i = 0; i < wordList.length; i++) {
        var word = wordList[i];
        var dist = getEditDistance(tok, word);
        if (dist < score) {
            console.log(word);
            score = dist;
            match = word;
        }
    }
    console.log("fn:getClosestMatch:", match, "=>", score, "for", tok);
    if (score <= threshold)
        return match;
//    return tok;
};
function parseText(text, caretPos) {
    lastState = text;
    lastCaretPos = caretPos;
    var tok = getTransformationUnit(text, caretPos);
//    console.log(tok);
    if (tok !== undefined) {
        var t, j;
        t = tok[0];
        j = tok[1];
        modified = false;

        if (/[a-zA-Z0-9]+/.test(t)) {
            if (t in tokenMap) {
                t = tokenMap[t];
//            text = text.substring(0, j + 1) + t + text.substring(caretPos);
                console.log("fn:parseText:text modified");
                modified = true;
            }
        }
        if (modified) {
            text = text.substring(0, j + 1) + t + text.substring(caretPos);
            caretPos += t.length - 1;
        }
        saveContext();
    }
    return [text, caretPos];
}
function getTransformationUnit(text, pos) {
//    console.log("fn:getTransformationUnit:text[" + text + "]", "=>", pos);
    if (typeof text === "string") {
        if (text.length >= pos && pos >= 0) {
            var token = "";
            var i = pos;
            if (text.charAt(i) === ' ')
                i--;
            while (i >= 0) {
                if (/[^a-zA-Z0-9]/.test(text.charAt(i)))
                    break;
                else
                    token = text.charAt(i) + token;
                i--;
            }
            return [token, i];
        }
    }
    console.log("fn:getTransformationUnit:Illegal argument");
}
function saveContext() {
    var loc = $(location).attr("href");
    if (typeof (Storage) !== undefined) {
        localStorage[loc] = JSON.stringify({
            "lastState": lastState,
            "modified": modified,
            "lastModificationNullified": lastModificationNullified,
            "lastCaretPos": lastCaretPos
        });
        console.log("fn:saveContext:Context saved!");
    }
}
function restoreContext() {
    var loc = $(location).attr("href");
    if (typeof (Storage) !== undefined) {
        var context = localStorage[loc];
//        console.log(context === undefined);
        if (context !== undefined) {
            context = jQuery.parseJSON(context);
//            console.log("Context: ", context);
            lastState = context["lastState"];
            modified = context["modified"];
            lastModificationNullified = context["lastModificationNullified"];
            lastCaretPos = context["lastCaretPos"];
            return true;
        }
    }
}
function initContext() {
    lastState = null;
    lastCaretPos = 0;
    modified = false;
    lastModificationNullified = false;
}
function setContext(state, stateModified, lastStateModificationCancled, caret) {
    lastState = state;
    modified = stateModified;
    lastModificationNullified = lastStateModificationCancled;
    lastCaretPos = caret;
}
function keypressHandler(e) {
    var el = jQuery($(this).get(0));
    var func = "val";
    if (restoreContext() === undefined)
        initContext();

    if (e.which === 32 && !lastModificationNullified) {
        var value = parseText(el[func](), el.prop("selectionStart"));
//        console.log(value);
        el[func](value[0]);
        el.setCursorPosition(value[1]);
    } else {
        setContext(el[func](), false, false, lastCaretPos);
        saveContext();
    }
}
function keyupHandler(e) {
    var el = jQuery($(this).get(0));
    var func = "val";
    if (restoreContext() === undefined)
        initContext();
    if (e.keyCode === 8) {
//        console.log("Backspace stroke!");
        if (modified) {
//            modified = false;
            el[func](lastState + " ");
            el.setCursorPosition(lastCaretPos + 1);
//            lastState = el[func]();
            setContext(el[func](), false, lastModificationNullified, lastCaretPos);
            saveContext();
            lastModificationNullified = true;
        }
    }
}
chrome.extension.sendRequest({"cmd": "options"}, function(response) {
//    options = response;

//    if (options.default_state === "enabled") {
    $("textarea").on("keypress", keypressHandler);
    $("textarea").on("keyup", keyupHandler);

});

//chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
//    if (request === "toggle_state") {
//        toggleState();
//        sendResponse({"enabled": enabled});
//    }
//});   