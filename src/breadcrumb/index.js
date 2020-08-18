import React from 'react';
import { checkBrowser } from '@util/util';
import './index.css';

/**
* @description 面包屑导航
* @props Array {crumbs} 配置  {
    text: '文本',
    pathname: `/space/${spaceId}`,
    render: () => {}
  }
* @props {className} String 自定义类名
*/
export default function Breadcrumb(props) {
  const {
    className = '',
    crumbs = []
  } = props;
  const { isMobile } = checkBrowser();
  if (!Array.isArray(crumbs) || crumbs.length === 0) {
    return null;
  }
  const createNavLink = ({ text, pathname, target }, isLastOne) => {
    const activeStyle = isLastOne ? { color: '#262626', fontWeight: 'bold' } : {};
    return <a className="ellipsis" style={activeStyle} href={pathname} target={target || ''}>{text}</a>
  };
  const _crumbs_ = crumbs.filter(n => !!n.text);
  const crumbsJsx = _crumbs_.map((n, i) => {
    return (<div
      className="breadcrumb-item flex ellipsis"
      key={i}>
      {n.render ? n.render(n) : createNavLink(n, i === _crumbs_.length - 1)}
      {(i !== _crumbs_.length - 1) && <span>/</span>}
    </div>);
  });
  const cls = $.trim(`breadcrumb${isMobile ? ' breadcrumb-mobile' : ''} ${className}`);
  return (
    <div className={cls}>
      {crumbsJsx}
    </div>
  );
};