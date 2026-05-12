/**
 * #42: bits-ui Tooltip の \`customAnchor\` prop に渡す virtual element factory。
 *
 * floating-ui の virtual element 仕様: \`getBoundingClientRect\` のみ実装すれば anchor として通る。
 * cursor follow 用途では width / height = 0 の point rect を返す (clientX / clientY をそのまま反映)。
 *
 * - flip / shift / arrow など floating-ui middleware は anchor の rect だけ見るので、
 *   \`side="top" align="start"\` + \`sideOffset / alignOffset\` で「カーソル右上」追従を実現できる
 * - viewport 外座標を渡しても shift middleware が clamp する責務 — anchor は生座標を透過
 *
 * https://floating-ui.com/docs/virtual-elements
 */

export type VirtualAnchor = {
	getBoundingClientRect: () => DOMRect;
};

export function createCursorAnchor(clientX: number, clientY: number): VirtualAnchor {
	const rect = {
		x: clientX,
		y: clientY,
		left: clientX,
		top: clientY,
		right: clientX,
		bottom: clientY,
		width: 0,
		height: 0,
		toJSON() {
			return {
				x: clientX,
				y: clientY,
				left: clientX,
				top: clientY,
				right: clientX,
				bottom: clientY,
				width: 0,
				height: 0
			};
		}
	} as DOMRect;
	return {
		getBoundingClientRect: () => rect
	};
}
