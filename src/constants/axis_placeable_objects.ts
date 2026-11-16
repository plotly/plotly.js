/**
 * Build the description for an axis-reference attribute such as `xref` or `yref`.
 * Returns the description text for the three position modes: axis, paper, and axis domain.
 *
 * @param axisname - The axis letter, for example `x` or `y`
 * @param lower - Name of the low end of the axis, for example `left` or `bottom`
 * @param upper - Name of the high end of the axis, for example `right` or `top`
 */
export function axisRefDescription(axisname: string, lower: string, upper: string) {
    return [
        `If set to a ${axisname} axis id (e.g. *${axisname}* or *${axisname}2*),`,
        `the \`${axisname}\` position refers to a ${axisname} coordinate.`,
        `If set to *paper*, the \`${axisname}\` position refers to the distance from the`,
        `${lower} of the plotting area in normalized coordinates where *0* (*1*) corresponds`,
        `to the ${lower} (${upper}). If set to a ${axisname} axis ID followed by *domain*`,
        `(separated by a space), the position behaves like for *paper*, but refers to the`,
        `distance in fractions of the domain length from the ${lower} of the domain of that`,
        `axis: e.g., *${axisname}2 domain* refers to the domain of the second ${axisname}`,
        `axis and a ${axisname} position of 0.5 refers to the point between the ${lower}`,
        `and the ${upper} of the domain of the second ${axisname} axis.`
    ].join(' ');
}
