import { defineComponent, h, onUnmounted, inject, ref, Ref, onMounted, PropType } from 'vue'
import XEUtils from 'xe-utils'
import GlobalConfig from '../../v-x-e-table/src/conf'
import { VXETable } from '../../v-x-e-table'
import { getFuncText, isEnableConf } from '../../tools/utils'
import { createItem, watchItem, destroyItem, assemItem, XEFormItemProvide } from './util'
import { renderTitle } from './render'

import { VxeFormConstructor, VxeFormDefines, VxeFormItemPropTypes, VxeFormPrivateMethods } from '../../../types/all'

export const formItemProps = {
  title: String as PropType<VxeFormItemPropTypes.Title>,
  field: String as PropType<VxeFormItemPropTypes.Field>,
  span: [String, Number] as PropType<VxeFormItemPropTypes.Span>,
  align: String as PropType<VxeFormItemPropTypes.Align>,
  titleAlign: String as PropType<VxeFormItemPropTypes.TitleAlign>,
  titleWidth: [String, Number] as PropType<VxeFormItemPropTypes.TitleWidth>,
  className: [String, Function] as PropType<VxeFormItemPropTypes.ClassName>,
  titleOverflow: { type: [Boolean, String] as PropType<VxeFormItemPropTypes.TitleOverflow>, default: null },
  titlePrefix: Object as PropType<VxeFormItemPropTypes.TitlePrefix>,
  titleSuffix: Object as PropType<VxeFormItemPropTypes.TitleSuffix>,
  resetValue: { default: null },
  visibleMethod: Function as PropType<VxeFormItemPropTypes.VisibleMethod>,
  visible: { type: Boolean as PropType<VxeFormItemPropTypes.Visible>, default: null },
  folding: Boolean as PropType<VxeFormItemPropTypes.Folding>,
  collapseNode: Boolean as PropType<VxeFormItemPropTypes.CollapseNode>,
  itemRender: Object as PropType<VxeFormItemPropTypes.ItemRender>
}

export default defineComponent({
  name: 'VxeFormItem',
  props: formItemProps,
  setup (props, { slots }) {
    const refElem = ref() as Ref<HTMLDivElement>
    const $xeform = inject('$xeform', {} as VxeFormConstructor & VxeFormPrivateMethods)
    const formGather = inject('xeformgather', null as XEFormItemProvide | null)
    const formItem = createItem($xeform, props)
    formItem.slots = slots

    watchItem(props, formItem)

    onMounted(() => {
      assemItem($xeform, refElem.value, formItem, formGather)
    })

    onUnmounted(() => {
      destroyItem($xeform, formItem)
    })

    const renderItem = ($xeform: VxeFormConstructor & VxeFormPrivateMethods, item: VxeFormDefines.ItemInfo) => {
      const { props, reactData } = $xeform
      const { data, rules, titleOverflow: allTitleOverflow } = props
      const { collapseAll } = reactData
      const { computeValidOpts } = $xeform.getComputeMaps()
      const validOpts = computeValidOpts.value
      const { slots, title, visible, folding, visibleMethod, field, collapseNode, itemRender, showError, errRule, className, titleOverflow } = item
      const compConf = isEnableConf(itemRender) ? VXETable.renderer.get(itemRender.name) : null
      const defaultSlot = slots ? slots.default : null
      const titleSlot = slots ? slots.title : null
      const span = item.span || props.span
      const align = item.align || props.align
      const titleAlign = item.titleAlign || props.titleAlign
      const titleWidth = item.titleWidth || props.titleWidth
      const itemOverflow = (XEUtils.isUndefined(titleOverflow) || XEUtils.isNull(titleOverflow)) ? allTitleOverflow : titleOverflow
      const showEllipsis = itemOverflow === 'ellipsis'
      const showTitle = itemOverflow === 'title'
      const showTooltip = itemOverflow === true || itemOverflow === 'tooltip'
      const hasEllipsis = showTitle || showTooltip || showEllipsis
      let itemVisibleMethod = visibleMethod
      const params = { data, property: field, item, $form: $xeform }
      let isRequired = false
      if (rules) {
        const itemRules = rules[field]
        if (itemRules) {
          isRequired = itemRules.some((rule) => rule.required)
        }
      }
      if (!itemVisibleMethod && compConf && compConf.itemVisibleMethod) {
        itemVisibleMethod = compConf.itemVisibleMethod
      }
      let contentVNs: any[] = []
      if (defaultSlot) {
        contentVNs = $xeform.callSlot(defaultSlot, params)
      } else if (compConf && compConf.renderItemContent) {
        contentVNs = compConf.renderItemContent(itemRender, params)
      } else if (field) {
        contentVNs = [`${XEUtils.get(data, field)}`]
      }
      if (collapseNode) {
        contentVNs.push(
          h('div', {
            class: 'vxe-form--item-trigger-node',
            onClick: $xeform.toggleCollapseEvent
          }, [
            h('span', {
              class: 'vxe-form--item-trigger-text'
            }, collapseAll ? GlobalConfig.i18n('vxe.form.unfolding') : GlobalConfig.i18n('vxe.form.folding')),
            h('i', {
              class: ['vxe-form--item-trigger-icon', collapseAll ? GlobalConfig.icon.FORM_FOLDING : GlobalConfig.icon.FORM_UNFOLDING]
            })
          ])
        )
      }
      if (errRule && validOpts.showMessage) {
        contentVNs.push(
          h('div', {
            class: 'vxe-form--item-valid',
            style: errRule.maxWidth ? {
              width: `${errRule.maxWidth}px`
            } : null
          }, errRule.message)
        )
      }
      const ons = showTooltip ? {
        onMouseenter (evnt: MouseEvent) {
          $xeform.triggerTitleTipEvent(evnt, params)
        },
        onMouseleave: $xeform.handleTitleTipLeaveEvent
      } : {}
      return h('div', {
        ref: refElem,
        class: ['vxe-form--item', item.id, span ? `vxe-col--${span} is--span` : '', className ? (XEUtils.isFunction(className) ? className(params) : className) : '', {
          'is--title': title,
          'is--required': isRequired,
          'is--hidden': visible === false || (folding && collapseAll),
          'is--active': !itemVisibleMethod || itemVisibleMethod(params),
          'is--error': showError
        }]
      }, [
        h('div', {
          class: 'vxe-form--item-inner'
        }, [
          title || titleSlot ? h('div', {
            class: ['vxe-form--item-title', titleAlign ? `align--${titleAlign}` : null, {
              'is--ellipsis': hasEllipsis
            }],
            style: titleWidth ? {
              width: isNaN(titleWidth as number) ? titleWidth : `${titleWidth}px`
            } : null,
            title: showTitle ? getFuncText(title) : null,
            ...ons
          }, renderTitle($xeform, item)) : null,
          h('div', {
            class: ['vxe-form--item-content', align ? `align--${align}` : null]
          }, contentVNs)
        ])
      ])
    }

    const renderVN = () => {
      const formProps = $xeform ? $xeform.props : null
      return formProps && formProps.customLayout ? renderItem($xeform, formItem as unknown as VxeFormDefines.ItemInfo) : h('div', {
        ref: refElem
      })
    }

    return renderVN
  }
})
