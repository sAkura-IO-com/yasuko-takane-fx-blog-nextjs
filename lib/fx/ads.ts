export type FxAd = {
  id: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  href?: string;
  text?: string;
};

export const fxAds: FxAd[] = [
  {
    id: "cat-sweets",
    image: "/fx/ads/cat-sweets.png",
    width: 745,
    height: 495,
    alt: "猫のスイーツ",
  },
  {
    id: "wine",
    image: "/fx/ads/wine.png",
    width: 742,
    height: 493,
    alt: "ワイン",
  },
  {
    id: "cat-mouse",
    image: "/fx/ads/cat-mouse.png",
    width: 1289,
    height: 1221,
    alt: "猫のマウス",
    text: "↑ あふぃいも使ってるマウスだよ！\n使いやすくてオススメ！",
  },
  {
    id: "fashion",
    image: "/fx/ads/fashion.png",
    width: 740,
    height: 494,
    alt: "ファッション雑誌",
  },
];
