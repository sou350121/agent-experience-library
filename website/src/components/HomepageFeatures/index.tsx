import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: '实战驱动',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        不仅是理论，更侧重于真实的 Agent 使用心得。每一篇文档都力求提供可复现的步骤与真实的实测数据。
      </>
    ),
  },
  {
    title: '工具对比',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        横向评测 Cursor, Claude Code, GPT-5.2 等前沿工具，帮你找到最适合当前任务的 Agent 方案。
      </>
    ),
  },
  {
    title: 'Prompt 沉淀',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        积累高质量、经过验证的 Prompt 库，涵盖从 UI 设计到复杂系统规划的各种实战场景。
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
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

export default function HomepageFeatures(): ReactNode {
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
