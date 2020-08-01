// ---------这里是一些业务相关的常用方法的合集2------------ //

import React from 'react';
import axiosInstance from '@util/axiosInstance';
import useMessage from '@hooks/use-message';
import Modal from '@common/modal';
import Image from '@common/image';
import Button from '@common/button';
import Icon from '@common/icon';
import { getIn, delay, getCatalogs, debunce } from '@util/util';
import { createNewDoc } from '@util/commonFun';

const message = useMessage();
// 是否正在获取模版列表
let loading = false;

// 预览该模版
const previewTemplate = (templateInfo) => {
  window.open(templateInfo.url, '_blank');
};

// 根据模版创建
const createDocByTemplateAction = async (templateInfo, spaceId, catalogInfo) => {
  const { title, html } = templateInfo;
  const [error, data] = await createNewDoc({
    space_id: spaceId,
    catalogInfo,
    title,
    html
  });
  const docId = getIn(data, ['docId']);
  if (docId) {
    message.success({ content: '创建成功' });
    await delay();
    window.location.href = `/simditor/${docId}?spaceId=${spaceId}`;
  } else {
    message.error({ content: getIn(error, ['message'], '系统繁忙') });
  }
};

/**
* 删除模版
* @param {object} info - 模版信息
  ----   {string} template_id - 模版id
*/
const deleteTemplate = async function (info = {}) {
  const [error, data] = await axiosInstance.post('delete/template', {
    templateId: info.template_id
  });
  if (getIn(data, ['STATUS']) === 'OK') {
    message.success({ content: '删除成功' });
  } else {
    message.error({ content: getIn(error, ['message'], '系统繁忙') });
  }
};

// 调用添加最近使用记录接口调用
export async function createDocByTemplate(spaceId, catalogInfo = {}) {
  if (loading) {
    return;
  }
  message.loading({ content: '正在获取模版列表' });
  loading = true;
  const [error, data] = await axiosInstance.post('templates');
  loading = false;
  if (!Array.isArray(data) || data.length === 0) {
    message.error({ content: getIn(error, ['message'], '您还未创建模版') });
    return;
  }
  message.hide();
  const templatesJsx = data
    .filter(n => n.url || n.cover)
    .map(item => {
      return (
        <div key={item.id}
          className="template">
          <Image src={item.cover} />
          <p>{item.title}</p>
          <div className="template-button">
            <Button onClick={() => { previewTemplate(item); }}>预览</Button>
            <Button type="primary"
              onClick={() => { createDocByTemplateAction(item, spaceId, catalogInfo); }}>创建</Button>
            <Icon type="close"
              onClick={() => { deleteTemplate(item); }} />
          </div>
        </div>
      );
    });
  Modal.confirm({
    width: 'auto',
    title: '所有模版',
    subTitle: '',
    footer: 'none',
    content: <div className="template-wrapper">{templatesJsx}</div>,
    onOk: async () => {
    }
  });
}

// 将文档/空间添加到快捷入口里
export async function addToShortcutEntry({
  title = '', // 标题
  url = '', // 链接
  signId = '',
  type = 'NORMAL'
}) {
  const [error, data] = await axiosInstance.post('create/shortcut', { title, url, type, signId });
  const success = Boolean(getIn(data, ['STATUS']) === 'OK');
  if (success) {
    message.success({ content: '添加成功' });
  } else {
    message.error({ content: getIn(error, ['message'], '系统繁忙，请稍后再试') });
  }
  return success;
}

/**
* 分享或/关闭分享
* @param {share} Number - 是否开启分享， 0关闭，1开启
*/
export async function toggleShare({ share = '0', docId }) {
  const [error, data] = await axiosInstance.post('doc/update', { is_share: share, doc_id: docId });
  const success = Boolean(getIn(data, ['STATUS']) === 'OK');
  const successMsg = share === '0' ? '关闭分享成功' : '开启分享成功';
  if (success) {
    message.success({ content: successMsg });
  } else {
    message.error({ content: getIn(error, ['message'], '系统繁忙，请稍后再试') });
  }
  return success;
}

// 编辑页/文档页/监听容器scroll，显示当前标题
export function listenContainerScrollToShowCurCatalog({
  html = '', // 文档html字符串
  $container = $(window)
}) {
  const catalogs = getCatalogs(html);
  let windowScrollTop = $(window).scrollTop();
  let position = 'up';

  if (!Array.isArray(catalogs) || catalogs.length === 0) {
    return;
  }

  const handle = debunce(() => {
    let curTarget = null;
    const arr = [];
    for (let i = 0, len = catalogs.length; i < len; i++) {
      const id = catalogs[i].id;
      if (!id || !$(`#${id}`).length) return;
      const offsetTop = $(`#${id}`).offset().top - $(document).scrollTop() - 58;
      const curWindowScrollTop = $(window).scrollTop();
      if (curWindowScrollTop - windowScrollTop > 0) {
        position = 'up';
      } else if (curWindowScrollTop - windowScrollTop < 0) {
        position = 'down';
      }
      arr.push({ top: offsetTop, id });
      windowScrollTop = curWindowScrollTop;
    };

    if (!arr.length) return;

    if (position === 'up') {
      if (arr.every(n => n.top > 0)) {
        curTarget = arr[0].id;
      } else {
        curTarget = (arr.filter(n => n.top >= 0)[0] || arr.slice(0).pop()).id;
      }
    } else {
      if (arr.every(n => n.top < 0)) {
        curTarget = arr[arr.length - 1].id;
      } else {
        curTarget = arr.filter(n => n.top >= 0)[0].id;
      }
    }
    const catalogBoxScrollTop = $('.catalog-box').scrollTop();
    const catalogHeight = $('.catalog-box').height();
    const catalogItemHeight = $(`.article-catalog__item-${curTarget}`).height() + 8;
    const catalogIndex = $(`.article-catalog__item-${curTarget}`).index();
    const totalItemHeight = catalogIndex * catalogItemHeight;
    const diff = totalItemHeight - (catalogBoxScrollTop + catalogHeight);
    // console.log('catalogBoxScrollTop:', catalogBoxScrollTop);
    // console.log('catalogHeight:', catalogHeight);
    // console.log('item.top', totalItemHeight);
    // console.log('diff:', diff);
    // console.log('----------------------', diff);
    if (diff) {
      $('.catalog-box').animate({ scrollTop: totalItemHeight - 200 }, 0);
    }
    $('.article-catalog__item').removeClass('article-catalog__item-active');
    $(`.article-catalog__item-${curTarget}`).addClass('article-catalog__item-active');
  }, 100);
  $container.off('scroll');
  $container.on('scroll', handle);
}

// 获取url-hash，滚动到对应元素位置
export function scrollToElement($container) {
  try {
    const id = window.location.hash.split('#')[1] || '';
    if (!id) {
      $container.animate({ scrollTop: 0 }, 0);
      return;
    }
    if ($(`#${id}`).length === 0) {
      return;
    };
    $container.animate({
      scrollTop: $(`#${id}`).offset().top - 58
    }, 400);
  } catch (error) { }
}