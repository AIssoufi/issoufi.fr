// @ts-check
// Constants of the formats that the helpers of `pnpm cv` read and write: the SVG drawings of the
// icons, the PDF that Chromium prints (its fonts, its dates, its trailer and its document
// information), and the URLs and addresses of the contact details.

/** XML declarations and comments of an SVG file, which an icon inside the page leaves out. */
export const XML_PROLOG_AND_COMMENTS_PATTERN = /<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->/g;

/** Opening of the root element of an SVG drawing, before its attributes. */
export const SVG_OPENING_PATTERN = /^<svg(?=[\s>])/;

/** Closing of the root element of an SVG drawing. */
export const SVG_CLOSING_TAG = '</svg>';

/**
 * Attributes that an icon of the CV gets: the class that sizes it, and the attribute that hides it
 * from screen readers and from the tags of the PDF, since the text next to it says what it shows.
 */
export const ICON_ATTRIBUTES = 'class="icon" aria-hidden="true"';

/** Type that pdf.js gives a Type 3 font, whose glyphs are drawings rather than a font file. */
export const TYPE3_FONT_TYPE = 'Type3';

/**
 * Prefix of six capital letters and a plus sign that a PDF writes before the name of a subset of
 * a font, e.g. `AAAAAA+Montserrat-Regular`.
 */
export const FONT_SUBSET_PREFIX_PATTERN = /^[A-Z]{6}\+/;

/**
 * Creation and modification dates of a PDF, with the key that names each one in its information
 * dictionary, e.g. `/CreationDate (D:20261019034028+00'00')`: Chromium writes the time of the
 * print, the only bytes that change when it prints the same page again.
 */
export const PDF_DATE_PATTERN = /(\/(?:CreationDate|ModDate)\s*)\((?:[^()\\]|\\.)*\)/g;

/** Keyword that starts the trailer of a PDF, which names its root and its information. */
export const PDF_TRAILER_KEYWORD = 'trailer';

/**
 * Last trailer of a PDF with a classic cross-reference table, up to the end of the file: its
 * dictionary, then the offset of that table, e.g.
 * `trailer\n<</Size 327\n/Root 314 0 R\n/Info 1 0 R>>\nstartxref\n75353\n%%EOF\n`.
 */
export const PDF_TRAILER_PATTERN = /^trailer\s*<<([\s\S]*)>>\s*startxref\s*(\d+)\s*%%EOF\s*$/;

/** Number of objects of a PDF, in its trailer, e.g. `/Size 327`. */
export const PDF_SIZE_PATTERN = /\/Size\s+(\d+)/;

/** Reference to the root of a PDF, in its trailer, e.g. `/Root 314 0 R`. */
export const PDF_ROOT_PATTERN = /\/Root\s+(\d+\s+\d+\s+R)/;

/**
 * Reference to the information dictionary of a PDF, in its trailer, e.g. `/Info 1 0 R`: its
 * object number, then its generation number.
 */
export const PDF_INFO_REFERENCE_PATTERN = /\/Info\s+(\d+)\s+(\d+)\s+R/;

/** Digits of the offset of an object in a cross-reference table of a PDF, padded with zeros. */
export const XREF_OFFSET_DIGITS = 10;

/** Digits of the generation number of an object in a cross-reference table of a PDF. */
export const XREF_GENERATION_DIGITS = 5;

/** Byte order mark that starts a text string of a PDF written in UTF-16BE, in hexadecimal. */
export const UTF16_BYTE_ORDER_MARK = 'FEFF';

/** Separator of the keywords in the document information of a PDF. */
export const PDF_KEYWORDS_SEPARATOR = ', ';

/**
 * Entries of the document information of a CV that `pnpm cv:audit` writes, those that describe
 * it: the others give the version of the PDF, the tools that wrote it and their dates.
 */
export const DESCRIPTIVE_INFO_KEYS = ['Title', 'Author', 'Subject', 'Keywords'];

/** Prefix of the URL of an email address. */
export const MAILTO_PREFIX = 'mailto:';

/** Prefix of the URL of a phone number. */
const TEL_PREFIX = 'tel:';

/**
 * A language code that the `lang` attribute accepts, such as `en` or `pt-BR`: a language of two or
 * three letters, then optional subtags.
 */
export const LANGUAGE_CODE_PATTERN = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

/** An email address: a name and a domain around a single `@`, without spaces. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

/** Schemes of the web addresses, which the CV writes without them, e.g. `github.com/AIssoufi`. */
export const WEB_PROTOCOLS = new Set(['https:', 'http:']);

/** Schemes of the URLs that the CV writes as links: web addresses, email and phone. */
export const LINK_PROTOCOLS = new Set([...WEB_PROTOCOLS, MAILTO_PREFIX, TEL_PREFIX]);

/** Start of the host of a URL that the CV leaves out of the text of a link. */
export const WWW_PREFIX = 'www.';

/** Slashes that end the path of a URL, which the CV leaves out of the text of a link. */
export const TRAILING_SLASHES_PATTERN = /\/+$/;
