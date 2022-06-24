const axios = require("axios")
class Filter {
  /**
   * Create a new PurgoMalum Filter
   * @param {Object} config - The config for the Filter
   * @param {string} config.fill_text - 	Text used to replace any words matching the profanity list. Accepts letters, numbers, underscores (_) tildes (~), exclamation points (!), dashes/hyphens (-), equal signs (=), pipes (|), single quotes ('), double quotes ("), asterisks (*), open and closed curly brackets ({ }), square brackets ([ ]) and parentheses (). Maximum length of 20 characters. When not used, the default is an asterisk (*) fill.
   * @param {string} config.fill_char - Single character used to replace any words matching the profanity list. Fills designated character to length of word replaced. Accepts underscore (_) tilde (~), dash/hyphen (-), equal sign (=), pipe (|) and asterisk (*). When not used, the default is an asterisk (*) fill.
   * @param {array} config.add - 	An array of additional words to be added to the profanity list. Accepts letters, numbers, underscores (_) and commas (,). Accepts up to 10 words (or 200 maximum characters in length). The filter is case-insensitive, so the case of your entry is not important.
   */
  constructor(config={
    fill_text: undefined,
    fill_char: undefined,
    add: []
  }) {
    this.config = config
  }

  /**
   * Removes profanity from text and returns cleaned text.
   * @param {string} text - The text to clean.
   * @returns {string} cleaned - Cleaned text
   */
  async clean(text) {
    var send = this.config
    send.text = text
    var response = await axios.get('https://www.purgomalum.com/service/json', {params: send});
    response = response.data
    if(response.hasOwnProperty("result")) return response.result
    else if(response.hasOwnProperty("error")) throw new Error(response.error)
    else throw new Error("Unexpected response from server")
  }
  /**
   * Checks if text contains profanity.
   * @param {string} text - The text to check.
   * @returns {boolean} hasProfanity - Whether text has profanity 
   */
  async containsProfanity(text) {
    var send = {text: text, add: this.config.add}
    var response = await axios.get('https://www.purgomalum.com/service/containsprofanity', {params: send});
    response = response.data
    return (response)
  }
}

module.exports = Filter