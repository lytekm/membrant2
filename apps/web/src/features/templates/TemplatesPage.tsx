import { ArrowUpRight, Clock } from '@phosphor-icons/react';
import { templates } from '@membrant/core';
import { CategoryIcon, PageHeader, type GoalActions } from '../../components/ui';

export function TemplatesPage({ onCreate }: Pick<GoalActions, 'onCreate'>) {
  return (
    <>
      <PageHeader
        title="Templates"
        description="Choose a starting point. Edit the target, reason and plan before you begin."
      />
      <div className="template-grid">
        {templates.map((template) => (
          <article className="template-card" key={template.id}>
            <div className="template-category">
              <CategoryIcon category={template.category} size={18} />
              <span>{template.category}</span>
            </div>
            <div className="template-content">
              <h2>{template.title}</h2>
              <p>{template.description}</p>
              <div className="row between">
                <span className="muted small row">
                  <Clock size={15} />
                  {template.weeks} weeks · {template.weeklyTarget} days/week
                </span>
                <button className="text-button" onClick={() => onCreate(template)}>
                  Use template <ArrowUpRight size={17} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
