// ─── Story Data ─────────────────────────────────────────────
export interface Story {
  id: string;
  name: string;
  imageUrl: string;
  alt: string;
  isOwn?: boolean;
  hasNewStory?: boolean;
}

export const stories: Story[] = [
  {
    id: "s1",
    name: "Your Story",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAz2wXJR3ocArz7ZE0YmbyGNdQoE2mBzfSJL9JJSuzO0rOSa-8xGc0vQYjXMxml5t_mUVl4UHTPs-JolEv0UNNupZ4SHCKZ8ZZgzh-e5HGztflVORINUOOfLcKA369f898bRH0ImqlnLDtAzghnUdYvyBDaD0oK8b7SCLenKEMPGayFEZaajt0xknP1Fh2Rfhu1IkHX9OCGqFFP2eNHeKh9PXtl8J91k8n9EdljWsKsO1eE2W9nOr1UvopNI_2QXlPyfJCXalKoRvQ",
    alt: "Beautiful sunset over a calm lake in the mountains",
    isOwn: true,
    hasNewStory: true,
  },
  {
    id: "s2",
    name: "Elena R.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAYiY-MUVVPjpl4nFNw1Ia7wc_wjW7exRCmQwuRX8PTS3YnBigXOxpNwnEPSMiUTD3HjHqNVGXEGMsRJ9dxUyU1uLK2j9QoyObDN-Td7qoLDM-P8QvHMDWWSsgQ24b-D_1V_ie9zkPJvNvznsgS7y45YwKhMCvDPuRXhYmdtNpPvj_myyV8zVRNOXzt_89uErte9wvQqVEWQYsFfg-_Kgw96QBYHIaj-_Oa3IEFVAImQ0wI5qqpF6WvkJ-dLxHvvVIuwDHZIIsojHE",
    alt: "Traveler standing in front of a turquoise waterfall",
    hasNewStory: false,
  },
  {
    id: "s3",
    name: "Marco V.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB42CL68q6HBEPeCLreoj5XMTK2bLzDR-28Ic1ChbfItNGUwAF05met0qIaxPgXwdBWI7PoDHdU37Sv-p_l7FD0Em65jWD6E6i-BfGHTF45J9_rxfIKoBsQyRX-QSwYcVA6MWme5ItUJycf4k1hQN7WLYwjgQMBdqvdB6vhnLMuOUPNfWY245INf0U3JLLC8IxTBYAFelB1TnUcs3d0LFDBQsujGSO9wS2t-fFJxU9xIXcRMz0fy35SZJ4Nc7gYKojz_v0ToDdG16k",
    alt: "Top view of tropical palm trees and white sand",
    hasNewStory: false,
  },
  {
    id: "s4",
    name: "Sasha K.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAqo7gfMYYJb8Vct1LAEdAgz1yUjOxq4jDDhJyDMM6vZJOTPthrm5gkWLR9r_09qFYTLpIU9dkAeleDOVTiSEgdgox_3P44pVg4TRjx7zVvbIRBAb_DzGLbBfU8SrsZZ5wlj6lB1BUpnXgGR4KUqR5XSnUSNfJspUj3Kt9uDV8c4pV0huxbcBe1C3ddwfwDXwtUWLaebqEccX1QC7La8ZL9lar_5OgTLk-YYNbHRap-Hi1NnkwRFGJinjhTiWRFoNDaTW7v5vqKpcI",
    alt: "Snowy mountain peaks under a clear blue sky",
    hasNewStory: false,
  },
];

// ─── Feed Post Data ─────────────────────────────────────────
export interface FeedPost {
  id: string;
  author: {
    name: string;
    username: string;
    avatarUrl: string;
    avatarAlt: string;
  };
  location: string;
  imageUrl: string;
  imageAlt: string;
  likes: string;
  comments: number;
  caption: string;
}

export const feedPosts: FeedPost[] = [
  {
    id: "fp1",
    author: {
      name: "Sarah Jenkins",
      username: "sarahj",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDu1o2G0wUua86CneQABBiUEhZun3368XoO1Oc2WXcRE1TZoidNyfkQcairCDvgz-UbpB4MUv-5C9i5dpTxf4PquEwCJ4A-urVnHXIxUMo_BL8QAUAPgRh1o0imZzlMdyTewGEchjsrxHoL6prTJFT6bcPOYdxbn-i48EVuVA1VwNA-_I9JWe54imIwWWmivmyJ-YCvqxUBDa2MStEO8_kldoBmlwhjZBFIn3fqRbPmcupXeFHlMjUudiwBSY8W6HTYQyEhd7dluuY",
      avatarAlt: "Portrait of a woman smiling with sunlight on her face",
    },
    location: "Santorini, Greece",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCaNDkzB8hIgTn1FA21I_0XR8Bn_Konyydkxt4UBUPqrL2d4pTl4k1PLUt2cFoi1CBCeyaosEFuw6rumpr_AAcZFtM_ewvuHRs0hnNHmHxN_yrhDGAx9jx8hy4IYZXbxTx-QWKWGT1ZHfuMeF0jVWNPCOELXYVvjW35UQ_UUcGMhX5k02OalACTuw35jQaJMHtMdwE-a7PTesu81TgQFDD8JEPwt-1Fi4cZloD9MsNiCyUcVYxLEPbjlnzSFuibi0gPqy9_MIBcfI0",
    imageAlt: "Classic white and blue buildings of Santorini overlooking the sea",
    likes: "1.2k",
    comments: 84,
    caption:
      "Waking up to this view is a secret I never want to stop sharing. The light in Oia is just different. 🇬🇷✨ #GreeceTravel #NomadSecrets",
  },
  {
    id: "fp2",
    author: {
      name: "David Lee",
      username: "david_travels",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCvA3tGrYPSfQEwnflrKgJ8PrS-2ViIwzRjzZmjy8WfHPSNyMq2SK8kYbBgvKy3_l4NYhxeD1Epu12SPimixZ8ODxaYx9-eDUOQ47Hqh0wjvo3iDFJAYQgzZtOn5E8VOe4qH2rggdFQmdqHT6OW-QblqigPctVbpC1_uYFYFYCIs0If6R8D6Gd-11LS6UBGtdyl6MKLIT1r0aJUOih2VsrSkwA6yKejf5x25iSMFNikPosecbDmB17_7a11vw5tKiedwkf_ZFkLkKk",
      avatarAlt: "Man wearing sunglasses in an urban outdoor setting",
    },
    location: "Kyoto, Japan",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA03QCX8eAlRjEz4Hs3rkBQp8e7c7xBGGGryr2gVp0_wVdiiHGe34I_iySAm-SCHWBkoRRP82Q0G6FrbXjoT8hPCYXvd1e4P7zJD-YyimAClWX3BdKPqmoyEzeHFOdn5OefJA2TaZa_EsX6D61v0juw9JkZNQccg93662JK4i9yV---_zSE7UWYwGyU8XxujPHe_O6qEX9wEyfd-DHA4gYqzH_ctCAptANyGY-1WQTDXGnS5FYzevYX1_VG_dQacYwntyIjzOuiMTA",
    imageAlt: "Ancient Japanese temple surrounded by vibrant autumn maple leaves",
    likes: "2.5k",
    comments: 112,
    caption:
      "Finding peace in the quiet moments of Gion. Kyoto never fails to inspire. ⛩️🍁 #Kyoto #Japan #SlowTravel",
  },
];

// ─── Suggested Travelers ────────────────────────────────────
export interface SuggestedTraveler {
  id: string;
  name: string;
  subtitle: string;
  avatarUrl: string;
  avatarAlt: string;
}

export const suggestedTravelers: SuggestedTraveler[] = [
  {
    id: "st1",
    name: "Lina Moore",
    subtitle: "Followed by sarahj",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDranN-5J0zwDhO2wKbilDP6CCERppz4bxEDObatjSm2pCbQQPUndY0Fe-FfgALd4d0_K5TZ8qxzEov0S6q9PowJscjcLEgjtIltjIdSUykoAz926lFoSTW5zXsI6IjSUj9eY74j6lh04PO1sj_Cps-Mp_kNT3OixlBTsSlMkvT8NxAt37xykdecF8nGaw92lJIqhxmfrlDUqqkgXWBv747GcTE4IbBTzc9nyKbrvB897mcAE9JHayjky6oxXiBt6Yghqm1tz8cpSc",
    avatarAlt: "Portrait of a young woman traveler with a camera",
  },
  {
    id: "st2",
    name: "James T.",
    subtitle: "New traveler",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAhz1ODIPKmv0xHZNN4QAyD1jYYCHjF7zPzolEhm4D_W3X2A5wT9eZs0Q6_QaXFnGR0wZgmj8Rid5IXE8HhyK09fh4xGNr09QRyuuSkLg3CXwIN2zvlH7dWsyiAljMe2NsIfRk1RDIRJ2OgEU6CY_YQAnhz5mPqWm7i76_benP3JUMY_AnlLG56Tdm_srYhJswKbKHtkFhz_88yLDOvrzqR803oVchhYrMpuascmeD-Zsf3rnw32PkEvAXnyQqONrz4rmVyKJXqu4o",
    avatarAlt: "Portrait of a smiling man in a outdoor environment",
  },
  {
    id: "st3",
    name: "Aria Bloom",
    subtitle: "Digital Nomad",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDSa5jd85zCmv49OG2AfybeuXWOwVg9wNJ8sCU5mBHYjh2LfQXbnnaBKfvzZ2M0C_xVrheCQuK4wRLwA9asHd9S8KcbrKu2vfaacuccW22g4zAE1jOuNNbLChSdbOZoDqSFxG149fKADNeEV7tDPt6rEfs1F9D9klCLlejy69g5GoKaWdP6gP2I7ufEuSALevik0pbFgsCp1tAXetgpBqAYc3gwhPXaWywWR49N500adJ5q51mbDSuVAYM021TlTkqsIjdq1iYG2Dw",
    avatarAlt: "Close up portrait of a woman looking at the camera",
  },
];

// ─── Trending Destinations (GemCards) ───────────────────────
export interface GemCardData {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  imageAlt: string;
  secretSpots: string;
}

export const trendingDestinations: GemCardData[] = [
  {
    id: "td1",
    title: "Lisbon",
    location: "Portugal",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAHhi9REvmGyd-eNzfxaLQtHfjqydVSTG_kkv-stZW3T5FB8CNR_xD3NUkUs1kq6I9r2z8tGEeY4bR_QEpZq1eptnGpso3R_R2ouDrdMNojMd9rnN70cNSPQY1n52dXA54X3zjl7_x3dLct6IntkU-jTBuXAJ4or6GOA6q2HhzF9bZ600UpS5n_v4iyN1t48Xjn7YKcRFGVEBl2WoY8nqHTYQlME7-6ZReiueGPyCJX8YY0H8n0biKQiPEWp56UQSwyuwvgQ2nO2zU",
    imageAlt: "Colorful tiles on a building facade in Lisbon, Portugal",
    secretSpots: "42k secret spots",
  },
  {
    id: "td2",
    title: "Bali",
    location: "Indonesia",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD4dqV_DFCArcFLxUTcUXnm9s6fU5y00j-af9pBzWL9CHpZ6iIGI22a0DaoCMurXu0RFPCawZvsf3smoyzP6awreeXuPR8zZfvHmL5GyfpMZisk5GQjZC6CRQv6K1JIOaCze1Eg0VjPVILQPoV6yTMK1niDcE_vnycQgN-PyJSZVMCMOhFhCfrz1xm4CnNfuq4K2huvV31SxiN8R3QQ6tfTfaReZiYdO3Ji2aJjgjdkEsG1K8_Tbsd2DtqnE8YC3YdSmvh4998dpu0",
    imageAlt: "Green lush rice terraces in Bali, Indonesia",
    secretSpots: "128k secret spots",
  },
  {
    id: "td3",
    title: "Agra",
    location: "India",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAenMlkeLgDmiCF2Kh5oBqumKaXJjbWiQhV6TXxIC-qCQsrxS3dNA4EWwIhCyfkEzMflcyUWoVNCMR-3_wy5UvWdm-FhLxHSIgjXpWiwrrkRPbOfWT2dfp8gFR4N7uSjDIPLZKxxJtvuNpCFup0prte5VM9kREcZ4ee6XDbf0qFg3gs7Nzx2dtbjXTJYt4J_mt9oWBGLswmZ1L2nC-p13ZpXk97SrTYNRnpbgZ1ZtSJpUjZZSke33QAAevTXQ6Ki6lvdVbNFxDA_Gs",
    imageAlt: "The Taj Mahal reflection in the water under a clear sky",
    secretSpots: "15k secret spots",
  },
  {
    id: "td4",
    title: "Reykjavik",
    location: "Iceland",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCPG_xxkml0--3qHUSNG5ozYB7JAOxScfKynfCYIG_jUZya52U94ZLblYgNfqDf4WZ_wjstB_bOtPCCkflw5wEgGdb8WjiLCSWHIcan1PcgYVOdwJCNF6EeI7r06_xZ9lBcpXPdiw94p3e9WPGo5ITdwHqYbDpzc-q61wQJbmpizn4D5mry-s43RkjGfOHczHQa2AMl5sgO-pqsNCOYcXTlXKR7Sv51267EJfQKzDhmSxHZZWKfiAAvjmITIphOB_3ojfkZYjXxgtY",
    imageAlt: "Modern architecture building in Reykjavik, Iceland",
    secretSpots: "8k secret spots",
  },
];

// ─── Pinned Trips ───────────────────────────────────────────
export interface PinnedTrip {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
}

export const pinnedTrips: PinnedTrip[] = [
  {
    id: "pt1",
    title: "Amalfi Coast",
    subtitle: "June 2024",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB_HYfXqM8tDezWilfKYx_cVTM6PhdGrz7sDzPvVlqW0cS0oVUIXUwBNGgyZlouoJlrITgdCs87XQ6LpqUWoOD8jRFHpmS2nwVuvZ7U91ptZCfPvc3RdoGwC8ks670SaA7UbofD-F_VTvxhC9B_TrEG_G247Wu4MhHnPbWAg7zSgBrMKDmOBI1fJl1iSftWE1HQygBJvVrzz7aoF8tHe3iMxXhRN-Dpui1z_PReF4l62EZi6M1hwGGToSvFqk_8RjFuqbJaP61W-ck",
    imageAlt: "Aerial view of colorful Positano buildings on a cliffside",
  },
  {
    id: "pt2",
    title: "Kyoto Temples",
    subtitle: "8 days left",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDH9KRV_zIRqei0ozEqzJ-YW7JYQXeFGI8Ty61j6YzsQYtm3oXohdHkU6cPh85ji9tSwS85hzKx9y-ZkJBsxywaJkjymI1pYJZkQguc_HfJBmo0G8pSYSohMTs6OLTJO-IyIu727pTRAiT1dcIUQvqzPXPwhktqlOfqF8P7R30jVfgB625RrnCRCV2wgVubPIINnQQUZsr8P3KV_1LYMjrDffqJvAqieuG0XflQdLaUnRZkaHdBomAi-HhdmfYxeM2R-ioDMDSdkts",
    imageAlt: "Red torii gates of a Japanese shrine in Kyoto",
  },
];

// ─── Navigation Links ───────────────────────────────────────
export interface NavLink {
  label: string;
  icon: string;
  href: string;
  isActive?: boolean;
  hasNotification?: boolean;
}

export const navLinks: NavLink[] = [
  { label: "Home", icon: "home", href: "/", isActive: true },
  { label: "Create", icon: "add_circle", href: "/post" },
  {
    label: "Notifications",
    icon: "notifications",
    href: "#",
    hasNotification: true,
  },
];

// ─── Sidebar Feed Links ────────────────────────────────────
export interface FeedLink {
  label: string;
  icon: string;
  href: string;
  isActive?: boolean;
}

export const feedLinks: FeedLink[] = [
  { label: "For You", icon: "auto_awesome", href: "#", isActive: true },
  { label: "Following", icon: "group", href: "#" },
  { label: "Popular", icon: "trending_up", href: "#" },
];

// ─── Filter Options ─────────────────────────────────────────
export const filterOptions = [
  "All",
  "Nature",
  "Urban",
  "Beach",
  "Mountain",
  "Cultural",
  "Food & Drink",
];

// ─── Footer Links ───────────────────────────────────────────
export const footerLinks = [
  { label: "About", href: "#" },
  { label: "Guidelines", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Cookies", href: "#" },
];
