import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '生活攻略大全',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        不论是宿舍生活小窍门，还是校园美食导航，这里汇集了华师一毕业生的实战经验，让你轻松应对大学日常。
      </>
    ),
  },
  {
    title: '专业导航灯塔',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        深度剖析各学科领域，提供专业的选择建议，结合就业前景和个人兴趣，助你规划理想未来。
      </>
    ),
  },
  {
    title: '校友智慧共享',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        由屈子炎学长发起，华师一学生群联盟助力，连接广泛的华师一毕业生网络，分享前辈的学习策略、生活心得，让你的大学之路不再孤单。
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
