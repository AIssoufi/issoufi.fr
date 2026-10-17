/** Number of cards per page before "Show all" is used. */
export const PAGE_SIZE = 3;
/** Duration of the like button's pop animation; matches the CSS animation. */
export const LIKE_ANIMATION_MS = 450;
/** Largest tilt of a card when the pointer is at one of its edges. */
export const CARD_MAX_TILT_DEG = 6;
/** Distance of the 3D viewpoint used for the card tilt; smaller values exaggerate it. */
export const CARD_PERSPECTIVE_PX = 800;
/** How much a hovered card rises. */
export const CARD_HOVER_LIFT_PX = 4;
/** Like state of a card that is missing from the initial data. */
export const NO_LIKE = { count: 0, liked: false } as const;
