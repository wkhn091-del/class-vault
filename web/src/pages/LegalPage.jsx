import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext.jsx';

const COPY = {
  privacy: {
    he: {
      title: 'פרטיות',
      body: [
        'המתיבתא היא ארכיון חומרי לימוד לכיתה. הקבצים והתיקיות נועדו לשימוש לימודי של התלמידים והמורים.',
        'אין חובה להירשם כדי לעיין או להוריד. העלאה ומחיקה דורשות קוד מורה בלבד.',
        'ייתכן שנשמרים נתונים טכניים בסיסיים לצורך תפעול האתר (למשל מצב שפה בדפדפן). איננו מוכרים מידע אישי.',
        'לשאלות בנושא פרטיות: אבישי רוזן, 050-3967230.',
      ],
    },
    en: {
      title: 'Privacy',
      body: [
        'HaMetivta is a classroom learning archive. Folders and files are meant for students and teachers.',
        'No account is required to browse or download. Upload and delete require a teacher passcode only.',
        'Basic technical data may be stored for site operation (for example UI language in the browser). We do not sell personal data.',
        'Privacy questions: Avishi Rosen, 050-3967230.',
      ],
    },
  },
  terms: {
    he: {
      title: 'תנאי שימוש',
      body: [
        'השימוש באתר מיועד לחומרי לימוד של המתיבתא. אין להעלות תוכן בלתי חוקי, פוגעני או שאינו קשור ללימוד.',
        'העלאת קבצים מותרת רק למי שיש בידו קוד מורה. האחריות לתוכן המועלה היא על המעלה.',
        'האתר מסופק כפי שהוא לצורך לימודי. ייתכנו הפסקות זמניות או שינויים.',
        'לבירורים: אבישי רוזן, 050-3967230.',
      ],
    },
    en: {
      title: 'Terms of use',
      body: [
        'This site is for HaMetivta learning materials. Do not upload illegal, harmful, or unrelated content.',
        'Uploads are allowed only with a teacher passcode. Uploaders are responsible for what they add.',
        'The site is provided as-is for learning. Temporary downtime or changes may occur.',
        'Questions: Avishi Rosen, 050-3967230.',
      ],
    },
  },
  accessibility: {
    he: {
      title: 'הצהרת נגישות',
      body: [
        'אנו שואפים לאפשר שימוש נוח בארכיון לכל התלמידים, כולל מקלדת, ניגודיות סבירה ותמיכה בהעדפת תנועה מופחתת.',
        'חלק מהתצוגות המקדימות של קבצים תלויות בדפדפן או בשירותי צד שלישי.',
        'רכז נגישות: אבישי רוזן · 050-3967230. נשמח לתקן ליקויים שתדווחו עליהם.',
      ],
    },
    en: {
      title: 'Accessibility statement',
      body: [
        'We aim for a usable archive for all students, including keyboard use, reasonable contrast, and reduced-motion support.',
        'Some file previews depend on the browser or third-party viewers.',
        'Accessibility coordinator: Avishi Rosen · 050-3967230. Please report issues so we can fix them.',
      ],
    },
  },
};

export default function LegalPage({ kind }) {
  const { t, locale } = useLocale();
  const page = COPY[kind]?.[locale] || COPY[kind]?.he;

  if (!page) return null;

  return (
    <article className="mx-auto max-w-2xl">
      <p className="mb-3 text-[13px] font-semibold text-navy/70">{t.footer}</p>
      <h1 className="text-[32px] text-navy sm:text-[40px]">{page.title}</h1>
      <div className="mt-4 h-px w-20 brass-rule" />
      <div className="mt-8 space-y-4 text-[16px] leading-relaxed text-graphite">
        {page.body.map((para) => (
          <p key={para}>{para}</p>
        ))}
      </div>
      <p className="mt-8 text-[14px] text-mute">
        {t.legalContact} · <bdi dir="ltr">{t.legalPhone}</bdi>
      </p>
      <Link
        to="/"
        className="mt-10 inline-block text-[15px] font-semibold text-navy underline-offset-4 hover:underline"
      >
        {t.backHome}
      </Link>
    </article>
  );
}
