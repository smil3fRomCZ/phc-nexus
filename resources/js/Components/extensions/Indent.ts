import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        indent: {
            increaseIndent: () => ReturnType;
            decreaseIndent: () => ReturnType;
        };
    }
}

const MAX_INDENT = 5;
const INDENT_PX = 24;

/**
 * Custom TipTap extension pro odsazení paragrafů a headingů.
 * Ukládá indent level jako `data-indent` atribut a aplikuje `margin-left` inline styl.
 * Tab → zvýšit, Shift+Tab → snížit. Max 5 úrovní (5 × 24px).
 */
export const Indent = Extension.create({
    name: 'indent',

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading'],
                attributes: {
                    indent: {
                        default: 0,
                        parseHTML: (el) => {
                            const attr = el.getAttribute('data-indent');
                            return attr ? Math.min(parseInt(attr, 10), MAX_INDENT) : 0;
                        },
                        renderHTML: (attrs) => {
                            const level = attrs.indent as number;
                            if (!level || level <= 0) return {};
                            return {
                                'data-indent': level,
                                style: `margin-left: ${level * INDENT_PX}px`,
                            };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            increaseIndent:
                () =>
                ({ tr, state, dispatch }) => {
                    const { from, to } = state.selection;
                    let changed = false;

                    state.doc.nodesBetween(from, to, (node, pos) => {
                        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                            const current = (node.attrs.indent as number) || 0;
                            if (current < MAX_INDENT) {
                                tr.setNodeMarkup(pos, undefined, {
                                    ...node.attrs,
                                    indent: current + 1,
                                });
                                changed = true;
                            }
                        }
                    });

                    if (changed && dispatch) {
                        dispatch(tr);
                    }
                    return changed;
                },

            decreaseIndent:
                () =>
                ({ tr, state, dispatch }) => {
                    const { from, to } = state.selection;
                    let changed = false;

                    state.doc.nodesBetween(from, to, (node, pos) => {
                        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                            const current = (node.attrs.indent as number) || 0;
                            if (current > 0) {
                                tr.setNodeMarkup(pos, undefined, {
                                    ...node.attrs,
                                    indent: current - 1,
                                });
                                changed = true;
                            }
                        }
                    });

                    if (changed && dispatch) {
                        dispatch(tr);
                    }
                    return changed;
                },
        };
    },

    addKeyboardShortcuts() {
        return {
            Tab: () => {
                // V seznamu necháme default TipTap chování (sinkListItem)
                if (this.editor.isActive('listItem')) {
                    return false;
                }
                return this.editor.commands.increaseIndent();
            },
            'Shift-Tab': () => {
                if (this.editor.isActive('listItem')) {
                    return false;
                }
                return this.editor.commands.decreaseIndent();
            },
        };
    },
});
