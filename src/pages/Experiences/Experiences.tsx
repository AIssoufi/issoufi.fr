import { useTranslation } from 'react-i18next';

import Experience from './Experience';
import ExperienceGroup from './ExperienceGroup';
import { BulletItem, BulletList } from './Experiences.styled';

import {
  ExperiencesPage,
  PageHeader,
  PageTitle,
  PeriodEnd,
  PeriodSep,
  PeriodStart,
  Timeline,
  TimelineContent,
  TimelineEntry,
  TimelinePeriod,
} from './Experiences.styled';

const BG_IMAGE = '/experiences.jpeg';

/**
 * Experiences page: a timeline of the professional experiences, most recent first, with their
 * roles, projects and technologies. Texts come from the `exp` translations.
 */
export const Experiences = () => {
  const { t } = useTranslation();

  return (
    <ExperiencesPage $backgroundImage={BG_IMAGE}>
      <PageHeader>
        <PageTitle>{t('exp.pageTitle')}</PageTitle>
      </PageHeader>
      <main>
        <Timeline>
          {/* ── Sewan ────────────────────────────────────────── */}
          <ExperienceGroup
            entityName={t('exp.sewan.name')}
            entityLogoUrl="/sewan.png"
            contractType={t('exp.sewan.contract')}
            city={t('exp.sewan.city')}
          >
            <ExperienceGroup.Role
              jobName={t('exp.sewanLead.title')}
              startDate={t('exp.sewanLead.start')}
              endDate={t('exp.sewanLead.end')}
            >
              {t('exp.sewanLead.intro1')}
              <strong>{t('exp.sewanLead.introStrong')}</strong>
              {t('exp.sewanLead.intro2')}
              <BulletList>
                <BulletItem>{t('exp.sewanLead.b1')}</BulletItem>
                <BulletItem>{t('exp.sewanLead.b2')}</BulletItem>
                <BulletItem>{t('exp.sewanLead.b3')}</BulletItem>
              </BulletList>
              <ExperienceGroup.Role.Project
                title={t('exp.sewanLead.proj1Title')}
                state={t('exp.sewanLead.proj1State')}
              >
                {t('exp.sewanLead.proj1Intro')}
                <BulletList>
                  <BulletItem>{t('exp.sewanLead.proj1B1')}</BulletItem>
                  <BulletItem>{t('exp.sewanLead.proj1B2')}</BulletItem>
                  <BulletItem>{t('exp.sewanLead.proj1B3')}</BulletItem>
                  <BulletItem>{t('exp.sewanLead.proj1B4')}</BulletItem>
                </BulletList>
              </ExperienceGroup.Role.Project>
              <ExperienceGroup.Role.Technologies
                technologies={[
                  'React.js',
                  'TypeScript',
                  'Storybook',
                  'Vite',
                  'tsup',
                  'pnpm',
                  'TDD',
                  'Vitest',
                  'Node.js',
                  'Lerna',
                  'CI GitLab',
                ]}
              />
            </ExperienceGroup.Role>

            <ExperienceGroup.Role
              jobName={t('exp.sewanSenior.title')}
              startDate={t('exp.sewanSenior.start')}
              endDate={t('exp.sewanSenior.end')}
            >
              {t('exp.sewanSenior.intro1')}
              <strong>{t('exp.sewanSenior.introStrong')}</strong>
              {t('exp.sewanSenior.intro2')}
              <BulletList>
                <BulletItem>{t('exp.sewanSenior.b1')}</BulletItem>
                <BulletItem>{t('exp.sewanSenior.b2')}</BulletItem>
                <BulletItem>{t('exp.sewanSenior.b3')}</BulletItem>
              </BulletList>
              <ExperienceGroup.Role.Project
                title={t('exp.sewanSenior.proj1Title')}
                technologies={['Node.js', 'GraphQL']}
              >
                {t('exp.sewanSenior.proj1Desc')}
              </ExperienceGroup.Role.Project>
              <ExperienceGroup.Role.Project
                title={t('exp.sewanSenior.proj2Title')}
                technologies={['React.js', 'TypeScript', 'Redux.js']}
              >
                {t('exp.sewanSenior.proj2Desc')}
              </ExperienceGroup.Role.Project>
            </ExperienceGroup.Role>
          </ExperienceGroup>

          {/* ── Wibilong ─────────────────────────────────────── */}
          <TimelineEntry>
            <TimelinePeriod>
              <PeriodStart>{t('exp.periods.wibilongStart')}</PeriodStart>
              <PeriodSep>↓</PeriodSep>
              <PeriodEnd>{t('exp.periods.wibilongEnd')}</PeriodEnd>
            </TimelinePeriod>
            <TimelineContent>
              <Experience
                jobName={t('exp.wibilong.title')}
                entityName={t('exp.wibilong.name')}
                entityLogoUrl="/wibilong.png"
                contractType={t('exp.wibilong.contract')}
                city={t('exp.wibilong.city')}
                startDate={t('exp.wibilong.start')}
                endDate={t('exp.wibilong.end')}
              >
                {t('exp.wibilong.intro')}
                <BulletList>
                  <BulletItem>{t('exp.wibilong.b1')}</BulletItem>
                  <BulletItem>{t('exp.wibilong.b2')}</BulletItem>
                  <BulletItem>{t('exp.wibilong.b3')}</BulletItem>
                </BulletList>
                <Experience.Technologies
                  technologies={[
                    'React.js',
                    'Redux.js',
                    'Node.js',
                    'AWS Lambda',
                    'API Gateway',
                    'CloudFormation',
                    'Elasticsearch',
                    'SQL Server',
                    'Swagger',
                  ]}
                />
              </Experience>
            </TimelineContent>
          </TimelineEntry>

          {/* ── Supralog ─────────────────────────────────────── */}
          <TimelineEntry>
            <TimelinePeriod>
              <PeriodStart>{t('exp.periods.supralogStart')}</PeriodStart>
              <PeriodSep>↓</PeriodSep>
              <PeriodEnd>{t('exp.periods.supralogEnd')}</PeriodEnd>
            </TimelinePeriod>
            <TimelineContent>
              <Experience
                jobName={t('exp.supralog.title')}
                entityName={t('exp.supralog.name')}
                entityLogoUrl="/supralog.png"
                contractType={t('exp.supralog.contract')}
                city={t('exp.supralog.city')}
                startDate={t('exp.supralog.start')}
                endDate={t('exp.supralog.end')}
              >
                <Experience.Project
                  title={t('exp.supralog.proj1Title')}
                  state={t('exp.supralog.proj1State')}
                  technologies={[
                    'React.js',
                    'Redux.js',
                    'Next.js',
                    'NestJS',
                    'Docker',
                    'Kubernetes',
                    'Google Cloud Platform',
                  ]}
                >
                  {t('exp.supralog.proj1Desc1')}
                  <strong>{t('exp.supralog.proj1Strong')}</strong>
                  {t('exp.supralog.proj1Desc2')}
                </Experience.Project>
                <Experience.Project
                  title={t('exp.supralog.proj2Title')}
                  state={t('exp.supralog.proj2State')}
                  technologies={['React.js', 'Redux.js', 'TypeScript', 'ChartJS']}
                >
                  {t('exp.supralog.proj2Desc1')}
                  <strong>{t('exp.supralog.proj2Strong')}</strong>
                  {t('exp.supralog.proj2Desc2')}
                </Experience.Project>
              </Experience>
            </TimelineContent>
          </TimelineEntry>

          {/* ── Beepeers ─────────────────────────────────────── */}
          <TimelineEntry>
            <TimelinePeriod>
              <PeriodStart>{t('exp.periods.beepeersStart')}</PeriodStart>
              <PeriodSep>↓</PeriodSep>
              <PeriodEnd>{t('exp.periods.beepeersEnd')}</PeriodEnd>
            </TimelinePeriod>
            <TimelineContent>
              <Experience
                jobName={t('exp.beepeers.title')}
                entityName={t('exp.beepeers.name')}
                entityLogoUrl="/beepeers.jpg"
                contractType={t('exp.beepeers.contract')}
                city={t('exp.beepeers.city')}
                startDate={t('exp.beepeers.start')}
                endDate={t('exp.beepeers.end')}
              >
                <Experience.Project
                  title={t('exp.beepeers.proj1Title')}
                  state={t('exp.beepeers.proj1State')}
                  technologies={['React.js', 'Redux.js', 'AngularJS']}
                >
                  {t('exp.beepeers.proj1Desc')}
                  <BulletList>
                    <BulletItem>{t('exp.beepeers.proj1B1')}</BulletItem>
                    <BulletItem>{t('exp.beepeers.proj1B2')}</BulletItem>
                    <BulletItem>{t('exp.beepeers.proj1B3')}</BulletItem>
                  </BulletList>
                </Experience.Project>
              </Experience>
            </TimelineContent>
          </TimelineEntry>
        </Timeline>
      </main>
    </ExperiencesPage>
  );
};
