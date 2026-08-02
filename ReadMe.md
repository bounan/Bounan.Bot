# Bounan Bot

A private Telegram bot.

## Actions:

- When a new video is downloaded, it:
  - registers it in the database
  - notifies the user via Telegram
- When a user interacts with the bot, it:
  - checks if the user is eligible to use the bot
  - provides information about the videos availability status

## External Connections

### Events Subscribed

- on-video-downloaded events (SNS)

### Events Published

None

### Used APIs:

- AniMan Lambda
- [Shikimori API](https://shikimori.one/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- LoanAPI

### Provided APIs

- Telegram webhook endpoint

---

## Legal Notice

This project does **not** host, distribute, or provide access to copyrighted content.

Bounan operates exclusively on metadata and event orchestration
and is intended to be used only with content sources and services that
the user has the legal right to access.

The authors of this project do not endorse or encourage the use of this
software for copyright infringement or any unlawful activity.

Responsibility for compliance with applicable laws and regulations
lies solely with the user of the software.

### License

This project is licensed under the BSD 3-Clause License.

See the LICENSE file for details.