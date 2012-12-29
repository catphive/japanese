(function ($, _) {
    "use strict";
    var segmenter = new TinySegmenter();
    function parseBlock(block) {
        var result = /^(\d+)\r\n(\d{2}):(\d{2}):(\d{2}),(\d{3})[ ]+-->[ ]+(\d{2}):(\d{2}):(\d{2}),(\d{3})\r\n(.*)/
            .exec(block);
        if (!result) {
            return null;
        }

        return {
            num: result[1],
            start: [result[2], result[3], result[4], result[5]],
            end: [result[6], result[7], result[8], result[9]],
            text: result[10]
        };
    }
    function parseSRT(text) {
        var blocks = text.split('\r\n\r\n');
        return _.compact(blocks.map(parseBlock));
    }

    function concatSRTs(srts) {
        return srts.map(function (srt) { return srt.text; }).join('\n');
    }

    function getWords(text) {
        return segmenter.segment(text).filter(function (segment) {
            return !/[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F\n\uFF01\uFF08\uFF09\uFF5E\uFF1F\u266A\u2192\u226A\u226B]/
                .test(segment);
        });
    }

    function genHistogram(words) {
        var hist = {};
        words.forEach(function (word) {
            if (!_.has(hist, word)) {
                hist[word] = 1;
            }

            hist[word] += 1;
        });
        return hist;
    }

    function sortHistogram(hist) {
        return _.pairs(hist).sort(function (left, right) {
            return right[1] - left[1];
        });
    }

    var entryTpl = $('#entry-tpl'),
        resultDiv = $('#result');

    function addEntry(word, count) {
        var entry = entryTpl.clone();
        entry.find('.word').text(word);
        entry.find('.count').text(count);
        entry.show();
        resultDiv.append(entry);
    }

    $('#files').change(function (evt) {
        var reader = new FileReader();
        reader.onload = function (loadEvt) {
            var text = concatSRTs(parseSRT(loadEvt.target.result));
            var sortedPairs = sortHistogram(genHistogram(getWords(text)));
            sortedPairs.forEach(function (pair) {
                addEntry(pair[0], pair[1]);
            });
        };
        reader.readAsText(evt.target.files[0]);
    });
}(jQuery, _));