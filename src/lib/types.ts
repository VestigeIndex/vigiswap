import { messages } from "./i18n";
// Widen every translation value to `string` so any locale (es, de, ar, ...) is
// assignable wherever `Messages` is expected. `typeof messages.en` would lock the
// values to English string literals and reject every other language.
export type Messages = { [K in keyof typeof messages.en]: string };
