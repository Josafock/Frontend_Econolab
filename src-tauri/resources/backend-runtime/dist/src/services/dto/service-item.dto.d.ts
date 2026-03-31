import { ServiceItemPriceType } from '../entities/service-order.entity';
export declare class CreateServiceItemDto {
    publicId?: string;
    studyId: number;
    priceType: ServiceItemPriceType;
    quantity: number;
    discountPercent?: number;
}
