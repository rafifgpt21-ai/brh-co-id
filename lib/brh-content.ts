export type LanguageCode = "id" | "en" | "ar";

export type LocalizedText = Record<LanguageCode, string[]>;

export interface PublicationBook {
  year: string;
  title: Record<LanguageCode, string>;
}

export interface JournalArticle {
  year: string;
  title: string;
  reference: string;
  url: string;
}

export interface ResearchArea {
  title: Record<LanguageCode, string>;
  subtitle?: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
}

export const languages: { code: LanguageCode; label: string }[] = [
  { code: "id", label: "Indonesia" },
  { code: "en", label: "English" },
];

export const about: LocalizedText = {
  id: [
    "Budi Rahman Hakim, S.Ag., M.S.W., Ph.D. adalah akademisi, penulis, jurnalis senior, dan pembina spiritual yang bergerak di persimpangan antara studi Islam, tasawuf, kesejahteraan sosial, media, dan pembangunan peradaban. Ia merupakan dosen UIN Syarif Hidayatullah Jakarta, wartawan senior Rakyat Merdeka Media Group, serta pendiri dan pengasuh Pesantren Peradaban Dunia JAGAT 'ARSY di BSD Serpong, Tangerang Selatan.",
    "Lahir di Sindangkasih, Purwakarta, pada 21 Oktober 1976, ia tumbuh dalam lingkungan pesantren dan tradisi keilmuan Islam. Pendidikan awalnya ditempuh di pesantren Persatuan Islam yang dirintis oleh keluarganya. Di sana, ia mendalami dasar-dasar ilmu keislaman klasik seperti nahwu, sharaf, balaghah, mantiq, dan tradisi pembacaan kitab melalui metode sorogan.",
    "Pada 1996, ia melanjutkan studi ke Jakarta dan menempuh pendidikan sarjana di IAIN, kini UIN Syarif Hidayatullah Jakarta, pada Jurusan Komunikasi dan Penyiaran Islam. Ia kemudian memperoleh beasiswa penuh dari Canadian International Development Agency untuk menempuh Bachelor of Social Work dan Master of Social Work di McGill University, Montreal, Kanada.",
    "Pada 2015, ia mengikuti NISIS Sandwich Program di Leiden University, Belanda, dan memperoleh beasiswa doktoral di Tilburg University School of Humanities and Digital Sciences. Di bawah supervisi Prof. Herman L. Beck dan Prof. Jan Blommaert, ia meneliti tasawuf dan tarekat dalam konteks Indonesia modern. Ia meraih gelar Ph.D. dengan disertasi berjudul Actualization of Neosufism: A Case Study of the Tariqa Qadiriyya Naqshabandiyya Pondok Pesantren Suryalaya.",
    "Selain berkarier di dunia akademik, ia memiliki pengalaman panjang dalam jurnalisme, komunikasi politik, dan kebijakan publik. Ia merintis karier sebagai wartawan hingga redaktur di Harian Rakyat Merdeka, kemudian masuk dalam jajaran manajemen dan menjadi salah satu shareholder media tersebut.",
    "Dalam bidang sosial-keagamaan, ia aktif dalam pengembangan Islam sufistik dan pendidikan berbasis nilai. Bersama istrinya, ia merintis Pesantren Peradaban Dunia JAGAT 'ARSY sebagai ikhtiar menghadirkan pendidikan Islam yang memadukan spiritualitas, ilmu pengetahuan, kepemimpinan, kemandirian, dan kepedulian terhadap masa depan peradaban.",
  ],
  en: [
    "Budi Rahman Hakim, S.Ag., M.S.W., Ph.D. is an academic, author, senior journalist, and spiritual mentor working at the intersection of Islamic studies, Sufism, social welfare, media, and civilizational development. He is a lecturer at UIN Syarif Hidayatullah Jakarta, a senior journalist at Rakyat Merdeka Media Group, and the founder and caregiver of JAGAT 'ARSY Civilization Boarding School in BSD Serpong, South Tangerang, Indonesia.",
    "Born in Sindangkasih, Purwakarta, on October 21, 1976, he was raised within a pesantren environment and an Islamic scholarly tradition. His early education was shaped by the Persatuan Islam pesantren tradition developed by his family, where he studied classical Islamic sciences and traditional textual learning through the sorogan method.",
    "In 1996, he moved to Jakarta to pursue higher education at IAIN, now UIN Syarif Hidayatullah Jakarta, majoring in Islamic Communication and Broadcasting. He later received a full scholarship from the Canadian International Development Agency to study Bachelor of Social Work and Master of Social Work at McGill University in Montreal, Canada.",
    "In 2015, he joined the NISIS Sandwich Program at Leiden University in the Netherlands and received a doctoral scholarship at Tilburg University School of Humanities and Digital Sciences. Under the supervision of Prof. Herman L. Beck and Prof. Jan Blommaert, he conducted research on Sufism and Sufi orders in modern Indonesia.",
    "Beyond academia, he has extensive experience in journalism, political communication, and public policy. He began his professional career as a journalist and editor at Harian Rakyat Merdeka, later joining its management and becoming one of the media group's shareholders.",
    "Through his academic works, books, media writings, educational initiatives, and spiritual mentorship, Budi Rahman Hakim seeks to bridge the pesantren tradition, Sufism, modern social sciences, and the challenges of contemporary society.",
  ],
  ar: [
    "بودي رحمن حكيم، دكتوراه في الفلسفة، وماجستير في الخدمة الاجتماعية، وبكالوريوس في الدراسات الإسلامية، أكاديمي وكاتب وصحفي بارز ومرشد روحي، يعمل في ملتقى الدراسات الإسلامية، والتصوف، والرعاية الاجتماعية، والإعلام، وبناء الحضارة.",
    "وهو محاضر في جامعة شريف هداية الله الإسلامية الحكومية بجاكرتا، وصحفي بارز في مجموعة راكيات مرديكا الإعلامية، ومؤسس ومشرف معهد جاغات عرشي للحضارة العالمية في BSD سيربونغ، تانغيرانغ الجنوبية، إندونيسيا.",
    "وُلد في سندانغكاسيه، بورواكرتا، في 21 أكتوبر 1976، ونشأ في بيئة المعاهد الإسلامية والتقاليد العلمية الدينية. وقد شكّل تعليمه الأول في تقاليد معاهد Persatuan Islam أساسا مهما في رحلته العلمية والروحية اللاحقة.",
    "في عام 1996، انتقل إلى جاكرتا لمتابعة دراسته الجامعية في المعهد الإسلامي الحكومي، الذي أصبح لاحقا جامعة شريف هداية الله الإسلامية الحكومية، في قسم الاتصال والدعوة الإسلامية.",
    "حصل على منحة كاملة من الوكالة الكندية للتنمية الدولية لدراسة البكالوريوس والماجستير في الخدمة الاجتماعية بجامعة ماكغيل في مونتريال، كندا. كما أجرى بحثه الدكتوراه حول التصوف والطرق الصوفية في إندونيسيا الحديثة.",
    "ومن خلال أعماله الأكاديمية، وكتبه، وكتاباته الإعلامية، ومبادراته التعليمية، وإرشاده الروحي، يسعى بودي رحمن حكيم إلى بناء جسر بين تقاليد المعاهد الإسلامية، والتصوف، والعلوم الاجتماعية الحديثة، وتحديات المجتمع المعاصر.",
  ],
};

export const books: PublicationBook[] = [
  { year: "2006", title: { id: "Teologi Penanggulangan Kemiskinan", en: "Theology of Poverty Alleviation", ar: "لاهوت مكافحة الفقر" } },
  { year: "2014", title: { id: "Rakyat Belum Merdeka", en: "The People Are Not Yet Free", ar: "الشعب لم يتحرر بعد" } },
  { year: "2015", title: { id: "Rethinking Social Work Indonesia", en: "Rethinking Social Work Indonesia", ar: "إعادة التفكير في الخدمة الاجتماعية في إندونيسيا" } },
  { year: "2015", title: { id: "Kenapa Berthoriqoh", en: "Why Follow a Sufi Path?", ar: "لماذا نسلك الطريق الصوفي؟" } },
  { year: "2015", title: { id: "Menembus Ruang dan Waktu, Vol. 1-2", en: "Penetrating Space and Time, Vol. 1-2", ar: "اختراق المكان والزمان، المجلدان 1-2" } },
  { year: "2017", title: { id: "Kanzul 'Arsy, Vol. 1-5", en: "Kanzul 'Arsy, Vol. 1-5", ar: "كنز العرش، المجلدات 1-5" } },
  { year: "2018", title: { id: "Tuntunan Sholat Thoriqoh", en: "Guidance for Thoriqoh Prayer", ar: "إرشادات صلاة الطريقة" } },
  { year: "2021", title: { id: "Seri Lautan Tanpa Tepi, Vol. 1-9", en: "The Boundless Ocean Series, Vol. 1-9", ar: "سلسلة البحر بلا شاطئ، المجلدات 1-9" } },
  { year: "2024", title: { id: "Selayang Pandang Tasawuf & Tarekat Sufi", en: "An Overview of Sufism and Sufi Orders", ar: "لمحة عن التصوف والطرق الصوفية" } },
  { year: "2025", title: { id: "Genealogi Neosufisme di Indonesia: Dari Asketisme ke Aktivisme Sosial", en: "Genealogy of Neo-Sufism in Indonesia: From Asceticism to Social Activism", ar: "جينالوجيا التصوف الجديد في إندونيسيا: من الزهد إلى النشاط الاجتماعي" } },
  { year: "2025", title: { id: "Akhlak Tasawuf: Pendidikan Karakter Berbasis Tarekat Sufi", en: "Sufi Ethics: Character Education Based on Sufi Orders", ar: "أخلاق التصوف: تربية الشخصية على أساس الطرق الصوفية" } },
  { year: "2025", title: { id: "Pengantar Ilmu Tasawuf: Fondasi Konseptual, Kerangka Filsafat dan Relevansi Zaman", en: "Introduction to Sufism: Conceptual Foundations, Philosophical Frameworks, and Contemporary Relevance", ar: "مدخل إلى علم التصوف: الأسس المفاهيمية والإطار الفلسفي وصلته بالعصر" } },
  { year: "2026", title: { id: "Resurgensi Islam Sufi: Spiritualitas, Modernitas, dan Masa Depan Peradaban", en: "The Resurgence of Sufi Islam: Spirituality, Modernity, and the Future of Civilization", ar: "عودة الإسلام الصوفي: الروحانية والحداثة ومستقبل الحضارة" } },
  { year: "2026", title: { id: "Sufinomic: Pilar Politik-Ekonomi untuk Indonesia Maju dan Sejahtera", en: "Sufinomic: Political-Economic Pillars for an Advanced and Prosperous Indonesia", ar: "الاقتصاد الصوفي: ركائز سياسية واقتصادية لإندونيسيا متقدمة ومزدهرة" } },
];

export const journals: JournalArticle[] = [
  { year: "2014", title: "Karakteristik dan isu-isu social work mutakhir di Indonesia", reference: "Empati: Jurnal Ilmu Kesejahteraan Sosial, 3(1).", url: "https://journal.uinjkt.ac.id/index.php/empati/article/view/9758" },
  { year: "2022", title: "Sufi ritual practices and perceived mental well-being: Insights from Indonesia's COVID-19 pandemic experience", reference: "Jurnal Sosial Humaniora dan Pendidikan, 1(2), 147-163.", url: "https://doi.org/10.55606/inovasi.v1i2.5326" },
  { year: "2022", title: "Sufi lifestyle, spiritual resilience, and social welfare: Psychospiritual and metabolic pathways to community health in the COVID-19 era", reference: "Jurnal Riset Rumpun Agama dan Filsafat, 1(2), 196-214.", url: "https://prin.or.id/index.php/JURRAFI/article/view/6698" },
  { year: "2023", title: "Tasawuf, nasionalisme, dan gerakan sosial: Studi spiritualitas transformasional Abah Sepuh dalam konteks kolonialisme dan kemerdekaan", reference: "Jurnal Sosial Humaniora dan Pendidikan, 2(2), 213-226.", url: "https://doi.org/10.55606/inovasi.v2i2.4761" },
  { year: "2023", title: "Neosufisme sebagai etika pembangunan: Studi atas transformasi spiritual Tarekat Qadiriyah Naqsyabandiyah Suryalaya di era Orde Baru", reference: "Jurnal Riset Rumpun Agama dan Filsafat, 2(2), 267-278.", url: "https://doi.org/10.55606/jurrafi.v2i2.5982" },
  { year: "2023", title: "Integration of Neo-Sufism in the social welfare education curriculum in Indonesian Islamic universities", reference: "International Journal of Education, Language, Literature, Arts, Culture, and Social Humanities, 1(4), 157-167.", url: "https://doi.org/10.59024/ijellacush.v1i4.1504" },
  { year: "2024", title: "Genealogi tarekat neosufi di Indonesia: Dari ritual eksklusif ke aksi sosial kolektif", reference: "Jurnal Riset Rumpun Ilmu Sosial, Politik dan Humaniora, 3(1), 247-259.", url: "https://doi.org/10.55606/jurrish.v3i1.5983" },
  { year: "2024", title: "Transformasi dari sociopreneurship ke sufipreneurship: Kerangka konseptual untuk menspiritualkan dunia kewirausahaan dalam Islam kontemporer", reference: "International Journal of Teaching and Learning, 2(9), 2695-2707.", url: "https://injotel.org/index.php/12/article/view/396" },
  { year: "2024", title: "Neo-Sufism as a social da'wah paradigm: Addressing challenges and transforming spirituality in modern Indonesia", reference: "International Journal of Educational Technology and Society, 1(3), 14-33.", url: "https://doi.org/10.61132/ijets.v1i3.336" },
  { year: "2025", title: "Optimizing ZIS for social welfare: Integrating religious values, state policy, and the role of social workers in Indonesia", reference: "Smart Society: Community Service and Empowerment Journal, 5(1), 21-29.", url: "https://doi.org/10.58524/smartsociety.v5i1.746" },
  { year: "2025", title: "Neo-Sufism and social welfare: The perspective of Indonesian Muslim social workers", reference: "EMPATI: Jurnal Ilmu Kesejahteraan Sosial, 14(1), 1-17.", url: "https://journal.uinjkt.ac.id/index.php/empati/article/view/46314/pdf" },
  { year: "2025", title: "Transformation of sufistic da'wah and Islamic psychotherapy through online manaqib", reference: "G-Couns: Jurnal Bimbingan dan Konseling, 9(3), 2278-2291.", url: "https://doi.org/10.31316/g-couns.v9i3.7780" },
  { year: "2025", title: "Sufi social work dalam konteks Indonesia modern: Tinjauan tematik atas kerangka teoretis dan praktik (1990-2024)", reference: "SHARE Social Work Journal, 15(1), 1-12.", url: "https://jurnal.unpad.ac.id/share/article/view/63635/26197" },
  { year: "2025", title: "Resurgence of Sufi Islam in Indonesia: From the periphery to the center", reference: "Jurnal Ilmu Ushuludin, 12(1).", url: "https://doi.org/10.15408/iu.v12i1.46798" },
  { year: "2025", title: "Sufism in Indonesia and its impact on the revival of Islamic social da'wah", reference: "Dakwah: Jurnal Dakwah dan Kemasyarakatan, 29(1).", url: "https://doi.org/10.15408/dk5zq828" },
];

export const researchAgenda: LocalizedText = {
  id: [
    "Penelitian saya berangkat dari keyakinan bahwa tasawuf bukan sekadar warisan spiritual masa lalu, melainkan sumber pengetahuan, etika, dan kebijaksanaan yang relevan untuk menjawab tantangan dunia kontemporer.",
    "Melalui pendekatan interdisipliner yang menghubungkan studi Islam, tasawuf, kesejahteraan sosial, pendidikan, ekonomi, dan peradaban, saya meneliti bagaimana tradisi sufistik dapat berkontribusi terhadap pembangunan manusia, transformasi sosial, keberlanjutan lingkungan, dan masa depan masyarakat global.",
    "Agenda intelektual ini berfokus pada hubungan antara spiritualitas, kesejahteraan, kepemimpinan moral, dan pembentukan peradaban yang lebih manusiawi di tengah perubahan sosial, teknologi, dan ekologis yang semakin kompleks.",
  ],
  en: [
    "My research is driven by the conviction that Sufism is not merely a spiritual legacy of the past, but a living source of knowledge, ethics, and wisdom capable of addressing contemporary global challenges.",
    "Working at the intersection of Islamic studies, social welfare, spirituality, education, economics, and civilizational development, I explore how Sufi traditions can contribute to human flourishing, social transformation, environmental sustainability, and the future of global civilization.",
    "My broader intellectual agenda examines the relationship between spirituality, social welfare, moral leadership, and the cultivation of a more humane civilization in an age shaped by technological disruption, ecological uncertainty, and cultural fragmentation.",
  ],
  ar: [
    "تنطلق أبحاثي من قناعة مفادها أن التصوف ليس مجرد تراث روحي من الماضي، بل هو مصدر حي للمعرفة والأخلاق والحكمة، قادر على الإسهام في مواجهة التحديات العالمية المعاصرة.",
    "ومن خلال مقاربة متعددة التخصصات تجمع بين الدراسات الإسلامية، والرعاية الاجتماعية، والروحانية، والتعليم، والاقتصاد، وبناء الحضارة، أسعى إلى استكشاف كيفية مساهمة التراث الصوفي في ازدهار الإنسان والتحول الاجتماعي والاستدامة البيئية.",
    "ويركز مشروعي الفكري الأوسع على العلاقة بين الروحانية، والرعاية الاجتماعية، والقيادة الأخلاقية، وبناء حضارة أكثر إنسانية في عصر يشهد تحولات تكنولوجية وبيئية وثقافية متسارعة.",
  ],
};

export const researchAreas: ResearchArea[] = [
  {
    title: { id: "Sufipreneurship Project", en: "Sufipreneurship Project", ar: "مشروع الريادة الصوفية" },
    description: {
      id: "Penelitian mengenai integrasi nilai-nilai tasawuf dengan kewirausahaan kontemporer. Proyek ini mengembangkan kerangka teoritis dan praktis tentang bagaimana spiritualitas dapat membentuk model ekonomi yang berorientasi pada kebermanfaatan sosial, keberlanjutan, dan pengembangan karakter.",
      en: "An interdisciplinary exploration of the integration of Sufi ethics and contemporary entrepreneurship, developing frameworks for socially responsible, spiritually grounded, and sustainable economic initiatives.",
      ar: "بحث في دمج القيم الصوفية مع ريادة الأعمال المعاصرة، بهدف تطوير نماذج اقتصادية قائمة على الأخلاق والمسؤولية الاجتماعية والاستدامة الإنسانية.",
    },
  },
  {
    title: { id: "The Smiling Face of Islam", en: "The Smiling Face of Islam", ar: "الوجه المبتسم للإسلام" },
    subtitle: {
      id: "The Heritage and Wisdom of Nusantara Sufism for a Global Civilization",
      en: "The Heritage and Wisdom of Nusantara Sufism for a Global Civilization",
      ar: "تراث وحكمة التصوف النوسنتاري من أجل حضارة عالمية",
    },
    description: {
      id: "Kajian mengenai kontribusi Islam Nusantara, khususnya tradisi tasawuf Indonesia, terhadap pembangunan peradaban global yang damai, inklusif, dan berkeadaban.",
      en: "A study of Indonesian Sufism as a civilizational resource for fostering peace, pluralism, and ethical coexistence in the modern world.",
      ar: "دراسة لمساهمة التصوف الإندونيسي في تعزيز السلام والتعددية والتعايش الحضاري، واستكشاف قدرته على تقديم بدائل أخلاقية في مواجهة التطرف والاستقطاب.",
    },
  },
  {
    title: { id: "Toward Ecosufism", en: "Toward Ecosufism", ar: "نحو التصوف البيئي" },
    subtitle: {
      id: "A New Islamic Paradigm in the Age of Planetary Crisis",
      en: "A New Islamic Paradigm in the Age of Planetary Crisis",
      ar: "نموذج إسلامي جديد في عصر الأزمة الكوكبية",
    },
    description: {
      id: "Penelitian tentang pengembangan paradigma Islam ekologis yang berakar pada kosmologi sufistik, etika lingkungan, perubahan iklim, keberlanjutan, dan tanggung jawab manusia sebagai khalifah.",
      en: "A research initiative developing an ecological Islamic paradigm rooted in Sufi cosmology and focused on environmental ethics, climate change, sustainability, and humanity's responsibility toward the Earth.",
      ar: "مشروع بحثي يسعى إلى تطوير رؤية إسلامية بيئية مستندة إلى الكوسمولوجيا الصوفية، مع التركيز على الأخلاق البيئية والاستدامة والتغير المناخي.",
    },
  },
  {
    title: { id: "Volume I: Jaringan Ulama Sufi Indonesia Modern", en: "Volume I: Modern Indonesian Sufi Networks", ar: "شبكات العلماء الصوفيين في إندونيسيا الحديثة" },
    subtitle: {
      id: "Sanad, Jaringan, dan Otoritas Spiritual",
      en: "Chains of Transmission, Networks, and Spiritual Authority",
      ar: "السند والشبكات والسلطة الروحية",
    },
    description: {
      id: "Kajian historis mengenai pembentukan jaringan ulama sufi Indonesia modern, transmisi sanad keilmuan, dinamika tarekat, dan konstruksi otoritas spiritual sejak akhir abad ke-19 hingga pertengahan abad ke-20.",
      en: "A historical investigation of modern Indonesian Sufi networks, scholarly transmission, spiritual lineages, and the evolution of religious authority from the late nineteenth century onward.",
      ar: "دراسة تاريخية لتشكل الشبكات الصوفية الإندونيسية الحديثة، وانتقال المعرفة الروحية، وتطور السلطة الدينية منذ أواخر القرن التاسع عشر.",
    },
  },
  {
    title: { id: "Volume II: Jaringan Ulama Sufi Indonesia Kontemporer", en: "Volume II: Contemporary Indonesian Sufi Networks", ar: "شبكات العلماء الصوفيين في إندونيسيا المعاصرة" },
    subtitle: {
      id: "Tarekat, Modernitas, dan Masa Depan Spiritualitas",
      en: "Sufi Orders, Modernity, and the Future of Spirituality",
      ar: "الطرق الصوفية والحداثة ومستقبل الروحانية",
    },
    description: {
      id: "Penelitian mengenai transformasi tarekat di era digital, perubahan pola otoritas keagamaan, serta adaptasi komunitas sufistik terhadap modernitas, teknologi, dan globalisasi.",
      en: "A study of how Sufi communities negotiate modernity, digital transformation, globalization, and changing forms of religious authority in contemporary Indonesia.",
      ar: "بحث في تحولات الطرق الصوفية في العصر الرقمي، وعلاقتها بالحداثة والعولمة وإعادة تشكيل السلطة الدينية.",
    },
  },
  {
    title: { id: "Sunda Islam / Islam Sunda", en: "Sunda Islam / Islam Sunda", ar: "إسلام سوندا" },
    subtitle: {
      id: "Resonansi Sufistik antara Kosmologi Sunda dan Tauhid Islam",
      en: "Sufistic Resonances between Sundanese Cosmology and Islamic Monotheism",
      ar: "الأصداء الصوفية بين الكوسمولوجيا السوندية والتوحيد الإسلامي",
    },
    description: {
      id: "Kajian mengenai proses Islamisasi Tatar Sunda sebagai transformasi makna yang mempertemukan kosmologi lokal dengan ajaran tauhid, dengan nilai-nilai sufistik sebagai jembatan budaya dan spiritual.",
      en: "A study of Islamization in the Sundanese world as cultural transformation and spiritual dialogue between indigenous cosmology and Islamic monotheism.",
      ar: "دراسة لعملية أسلمة المجتمع السوندي بوصفها حوارا حضاريا وروحيا بين الثقافة المحلية والعقيدة الإسلامية، مع التركيز على الدور الوسيط للقيم الصوفية.",
    },
  },
];
