
<h1  align="center">purgomalum-swear-filter </h1>

<p>

<img  alt="Version"  src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000"  />

<a  href="https://github.com/codergautam/purgomalum-swear-filter/graphs/commit-activity"  target="_blank">

<img alt="Maintenance" src="https://img.shields.io/badge/maintained-yes-green.svg" />

</a>
<img alt="npm" src="https://img.shields.io/npm/dt/purgomalum-swear-filter">

</p>

> ### The easiest way to block swearing on your project!


## Install

  

```sh
npm i purgomalum-swear-filter
```

##  Usage

Here is a basic example of how `purgomalum-swear-filter` works:

```js
const Filter = require("purgomalum-swear-filter")
var filter = new Filter()

filter.clean("Hello a$$")
.then((cleanedText) => {
	console.log(cleanedText) //Hello ***
})
```
You can also use `filter.containsProfanity()`, to check if text contains profanity. It returns a boolean.

```js 
filter.containsProfanity("Hello")
.then((isBad) => {
	console.log(isBad) //false
})
```
If you don't like promises, you can always use `await` in an `async` function:
```js
async function() {
	var cleaned = await filter.clean("hello") 
	console.log(cleaned) //hello
}
```
One of the coolest things about this filter, is that it doesn't always filter out substrings. For example:

```js
await filter.containsProfanity("cock") // true
await filter.containsProfanity("cockpit") // false
```
#### Filter Config

You can use a filter config to change functionality of the Purgomalum Filter. Here is a filter object:

```json
{
fill_text: "[CENSORED]", 
fill_char: "~",
add: ["badword", "profanityword"]
}
```  

Here is a short explanation about each of them (from the official Purgomalum Website)

| Name | Type| Description|
|--|--|--| 
| fill_text | string | Text used to replace any words matching the profanity list. Accepts letters, numbers, underscores (_) tildes (~), exclamation points (!), dashes/hyphens (-), equal signs (=), pipes (\|), single quotes ('), double quotes ("), asterisks (*), open and closed curly brackets ({ }), square brackets ([ ]) and parentheses (). Maximum length of 20 characters. When not used, the default is an asterisk (\*) fill. |
|fill_char|string|Single character used to replace any words matching the profanity list. Fills designated character to length of word replaced. Accepts underscore (_) tilde (~), dash/hyphen (-), equal sign (=), pipe (\|) and asterisk (\*). When not used, the default is an asterisk (\*) fill.|
| add | array | An array of additional words to be added to the profanity list. Accepts letters, numbers, underscores (_) and commas (,). Accepts up to 10 words (or 200 maximum characters in length). The filter is case-insensitive, so the case of your entry is not important. |

> **Note**: You can only have either  `fill_char` or `fill_text`. You cannot have both.

You can use the config object to create a new `Filter`, like this:

```
var config = {
	fill_char: "*",
	add: []
}
var filter = new Filter(config)
```



## Author

  

👤 **CoderGautamYT**

  

* YouTube: https://youtube.com/codergautam

* Github: [@codergautam](https://github.com/codergautam)

  

## 🤝 Conclusion



Contributions, issues and feature requests are welcome!<br  />  Find any issues? Please report them on the [issues page](https://github.com/codergautam/purgomalum-swear-filter/issues). 

Give a ⭐️ if this project helped you!

### 🏠 [Github](https://github.com/codergautam/purgomalum-swear-filter)

  
