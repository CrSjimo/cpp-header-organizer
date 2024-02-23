const fs = require('fs');
const HeaderRegEx = /^\s*#\s*include\s*(["<].*[">])/;
const StdHeaders = ['<concepts>', '<coroutine>', '<any>', '<bitset>', '<chrono>', '<compare>', '<csetjmp>', '<csignal>', '<cstdarg>', '<cstddef>', '<cstdlib>', '<ctime>', '<debugging>', '<expected>', '<functional>', '<initializer_list>', '<optional>', '<source_location>', '<tuple>', '<type_traits>', '<typeindex>', '<typeinfo>', '<utility>', '<variant>', '<version>', '<memory>', '<memory_resource>', '<new>', '<scoped_allocator>', '<cfloat>', '<cinttypes>', '<climits>', '<cstdint>', '<limits>', '<stdfloat>', '<cassert>', '<cerrno>', '<exception>', '<stacktrace>', '<stdexcept>', '<system_error>', '<cctype>', '<charconv>', '<cstring>', '<cuchar>', '<cwchar>', '<cwctype>', '<format>', '<string>', '<string_view>', '<array>', '<deque>', '<flat_map>', '<flat_set>', '<forward_list>', '<list>', '<map>', '<mdspan>', '<queue>', '<set>', '<span>', '<stack>', '<unordered_map>', '<unordered_set>', '<vector>', '<iterator>', '<generator>', '<ranges>', '<algorithm>', '<execution>', '<bit>', '<cfenv>', '<cmath>', '<complex>', '<linalg>', '<numbers>', '<numeric>', '<random>', '<ratio>', '<valarray>', '<clocale>', '<codecvt>', '<locale>', '<text_encoding>', '<cstdio>', '<fstream>', '<iomanip>', '<ios>', '<iosfwd>', '<iostream>', '<istream>', '<ostream>', '<print>', '<spanstream>', '<sstream>', '<streambuf>', '<strstream>', '<syncstream>', '<filesystem>', '<regex>', '<atomic>', '<barrier>', '<condition_variable>', '<future>', '<hazard_pointer>', '<latch>', '<mutex>', '<rcu>', '<semaphore>', '<shared_mutex>', '<stop_token>', '<thread>', '<assert.h>', '<ctype.h>', '<errno.h>', '<fenv.h>', '<float.h>', '<inttypes.h>', '<limits.h>', '<locale.h>', '<math.h>', '<setjmp.h>', '<signal.h>', '<stdarg.h>', '<stddef.h>', '<stdint.h>', '<stdio.h>', '<stdlib.h>', '<string.h>', '<time.h>', '<uchar.h>', '<wchar.h>', '<wctype.h>', '<stdatomic.h>', '<ccomplex>', '<complex.h>', '<ctgmath>', '<tgmath.h>', '<ciso646>', '<cstdalign>', '<cstdbool>', '<iso646.h>', '<stdalign.h>', '<stdbool.h>'];

let contentLines = fs.readFileSync(process.argv[2]).toString().split('\n');

let headerLineNumbers = [];
let headerLineContent = [];

for (let i = 0; i < contentLines.length; i++) {
    let line = contentLines[i];
    if (/^\s*$/.test(line))
        continue;
    if (!HeaderRegEx.test(line)) {
        if (headerLineContent.length)
            break;
        continue;
    }
    headerLineNumbers.push(i);
    headerLineContent.push(line);
}

let buddyHeaderLines = [];
let buddyFinished = false;
let stdHeaderLines = [];
let qtHeaderLines = [];
let qtMediateHeaderLines = [];
let libraryHeaderLines = [];
let projectHeaderLines = [];

for (let line of headerLineContent) {
    let header = HeaderRegEx.exec(line)[1];
    if (header.startsWith('"')) {
        if (buddyFinished)
            projectHeaderLines.push(line);
        else
            buddyHeaderLines.push(line);
    } else {
        buddyFinished = true;
        if (StdHeaders.includes(header))
            stdHeaderLines.push(line);
        else if (/^<QM(Core|Widgets)/.test(header))
            qtMediateHeaderLines.push(line);
        else if (header.startsWith('<Q') || header.startsWith('<private/q'))
            qtHeaderLines.push(line);
        else
            libraryHeaderLines.push(line);
    }
}

if (buddyHeaderLines.length)
    buddyHeaderLines.push('');

if (stdHeaderLines.sort().length)
    stdHeaderLines.push('');

if (qtHeaderLines.sort().length)
    qtHeaderLines.push('');

let combinedLibraryHeaderLines = [...qtMediateHeaderLines.sort(), ...libraryHeaderLines.sort()];
if (combinedLibraryHeaderLines.length)
    combinedLibraryHeaderLines.push('');

if (projectHeaderLines.sort().length)
    projectHeaderLines.push('');

headerLineContent = [
    ...buddyHeaderLines,
    ...stdHeaderLines,
    ...qtHeaderLines,
    ...combinedLibraryHeaderLines,
    ...projectHeaderLines,
]

let headerStart = headerLineNumbers[0];
let headerEnd = headerLineNumbers[headerLineNumbers.length - 1] + 1;
if (/^\s*$/.test(contentLines[headerEnd])) {
    if (headerLineContent.length && headerLineContent[headerLineContent.length - 1] == '')
        headerLineContent.pop();
}

contentLines = [...contentLines.slice(0, headerStart), ...headerLineContent, ...contentLines.slice(headerEnd)];

fs.writeFileSync(process.argv[2], contentLines.join('\n'));
