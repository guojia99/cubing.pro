"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/is-mobile";
exports.ids = ["vendor-chunks/is-mobile"];
exports.modules = {

/***/ "(ssr)/./node_modules/is-mobile/index.js":
/*!*****************************************!*\
  !*** ./node_modules/is-mobile/index.js ***!
  \*****************************************/
/***/ ((module) => {

eval("\n\nmodule.exports = isMobile\nmodule.exports.isMobile = isMobile\nmodule.exports[\"default\"] = isMobile\n\nconst mobileRE = /(android|bb\\d+|meego).+mobile|armv7l|avantgo|bada\\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\\/|plucker|pocket|psp|redmi|series[46]0|samsungbrowser.*mobile|symbian|treo|up\\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i\nconst notMobileRE = /CrOS/\n\nconst tabletRE = /android|ipad|playbook|silk/i\n\nfunction isMobile (opts) {\n  if (!opts) opts = {}\n  let ua = opts.ua\n  if (!ua && typeof navigator !== 'undefined') ua = navigator.userAgent\n  if (ua && ua.headers && typeof ua.headers['user-agent'] === 'string') {\n    ua = ua.headers['user-agent']\n  }\n  if (typeof ua !== 'string') return false\n\n  let result =\n    (mobileRE.test(ua) && !notMobileRE.test(ua)) ||\n    (!!opts.tablet && tabletRE.test(ua))\n\n  if (\n    !result &&\n    opts.tablet &&\n    opts.featureDetect &&\n    navigator &&\n    navigator.maxTouchPoints > 1 &&\n    ua.indexOf('Macintosh') !== -1 &&\n    ua.indexOf('Safari') !== -1\n  ) {\n    result = true\n  }\n\n  return result\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvaXMtbW9iaWxlL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFZOztBQUVaO0FBQ0EsdUJBQXVCO0FBQ3ZCLHlCQUFzQjs7QUFFdEI7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIi9Vc2Vycy9ndW9qaWEvd29ya2VyL2NvZGUvY3ViZS9jdWJpbmdQcm8vY3ViaW5nLnByby9ub2RlX21vZHVsZXMvaXMtbW9iaWxlL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTW9iaWxlXG5tb2R1bGUuZXhwb3J0cy5pc01vYmlsZSA9IGlzTW9iaWxlXG5tb2R1bGUuZXhwb3J0cy5kZWZhdWx0ID0gaXNNb2JpbGVcblxuY29uc3QgbW9iaWxlUkUgPSAvKGFuZHJvaWR8YmJcXGQrfG1lZWdvKS4rbW9iaWxlfGFybXY3bHxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlyaXN8a2luZGxlfGxnZSB8bWFlbW98bWlkcHxtbXB8bW9iaWxlLitmaXJlZm94fG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8cmVkbWl8c2VyaWVzWzQ2XTB8c2Ftc3VuZ2Jyb3dzZXIuKm1vYmlsZXxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyAoY2V8cGhvbmUpfHhkYXx4aWluby9pXG5jb25zdCBub3RNb2JpbGVSRSA9IC9Dck9TL1xuXG5jb25zdCB0YWJsZXRSRSA9IC9hbmRyb2lkfGlwYWR8cGxheWJvb2t8c2lsay9pXG5cbmZ1bmN0aW9uIGlzTW9iaWxlIChvcHRzKSB7XG4gIGlmICghb3B0cykgb3B0cyA9IHt9XG4gIGxldCB1YSA9IG9wdHMudWFcbiAgaWYgKCF1YSAmJiB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJykgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50XG4gIGlmICh1YSAmJiB1YS5oZWFkZXJzICYmIHR5cGVvZiB1YS5oZWFkZXJzWyd1c2VyLWFnZW50J10gPT09ICdzdHJpbmcnKSB7XG4gICAgdWEgPSB1YS5oZWFkZXJzWyd1c2VyLWFnZW50J11cbiAgfVxuICBpZiAodHlwZW9mIHVhICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlXG5cbiAgbGV0IHJlc3VsdCA9XG4gICAgKG1vYmlsZVJFLnRlc3QodWEpICYmICFub3RNb2JpbGVSRS50ZXN0KHVhKSkgfHxcbiAgICAoISFvcHRzLnRhYmxldCAmJiB0YWJsZXRSRS50ZXN0KHVhKSlcblxuICBpZiAoXG4gICAgIXJlc3VsdCAmJlxuICAgIG9wdHMudGFibGV0ICYmXG4gICAgb3B0cy5mZWF0dXJlRGV0ZWN0ICYmXG4gICAgbmF2aWdhdG9yICYmXG4gICAgbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMSAmJlxuICAgIHVhLmluZGV4T2YoJ01hY2ludG9zaCcpICE9PSAtMSAmJlxuICAgIHVhLmluZGV4T2YoJ1NhZmFyaScpICE9PSAtMVxuICApIHtcbiAgICByZXN1bHQgPSB0cnVlXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG59XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/is-mobile/index.js\n");

/***/ })

};
;