import { decimalToNumber } from "@/lib/money/fee";

type WithFee = {
  fee: { toNumber(): number } | number | string;
};

export function serializeExpertService<T extends WithFee>(service: T) {
  return {
    ...service,
    fee: decimalToNumber(service.fee),
  };
}

export function serializeExpertServices<T extends WithFee>(services: T[]) {
  return services.map(serializeExpertService);
}
