import { utils } from 'ethers';
import { BigNumberish } from 'ethers/utils';

export function fromBaseUnits(base: BigNumberish) {
  return utils.formatUnits(base, 18);
}

export function sliceDecimals(floatingPt: string, decimalDigits: number = 3) {
  const point = floatingPt.indexOf('.');
  const integer = floatingPt.slice(0, point);
  const fractional = floatingPt.slice(point, point + decimalDigits);
  return integer + fractional;
}

export function commifyBaseUnits(base: BigNumberish, decimalDigits: number = 3) {
  return sliceDecimals(utils.commify(fromBaseUnits(base)), decimalDigits);
}

function toSolidityTypes(methodAbi: any[]) {
  return methodAbi
    .map((typeAbi: any) => `${typeAbi.type}${typeAbi.name && ` ${typeAbi.name}`}`)
    .join(', ');
}

export function formatMethodTypes(methodAbi: any) {
  const inputs = toSolidityTypes(methodAbi.inputs);
  const outputs =
    methodAbi.outputs && methodAbi.outputs.length > 0
      ? `: (${toSolidityTypes(methodAbi.outputs)})`
      : '';
  const signature = `${methodAbi.name}(${inputs})${outputs}`;
  return { ...methodAbi, signature };
}

const nonNumRegex = /^([^0-9]*)$/;

export function sanitizeEvents(events) {
  return events.map(event => {
    const newValues = Object.keys(event.values).reduce((acc, eventArg) => {
      let value = event.values[eventArg];
      if (nonNumRegex.test(eventArg) && eventArg !== 'length') {
        if (value.hasOwnProperty('_hex')) {
          value = value.toString();
        }
        return {
          ...acc,
          [eventArg]: value,
        };
      }
      return acc;
    }, {});

    return {
      ...event,
      values: newValues,
    };
  });
}

