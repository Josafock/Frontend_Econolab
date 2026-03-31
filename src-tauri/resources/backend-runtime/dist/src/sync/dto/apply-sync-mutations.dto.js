"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplySyncMutationsDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const sync_outbox_event_entity_1 = require("../entities/sync-outbox-event.entity");
class SyncInboundMutationDto {
    resourceType;
    operation;
    payload;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], SyncInboundMutationDto.prototype, "resourceType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(sync_outbox_event_entity_1.SyncOutboxOperation),
    __metadata("design:type", String)
], SyncInboundMutationDto.prototype, "operation", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SyncInboundMutationDto.prototype, "payload", void 0);
class ApplySyncMutationsDto {
    mutations;
}
exports.ApplySyncMutationsDto = ApplySyncMutationsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SyncInboundMutationDto),
    __metadata("design:type", Array)
], ApplySyncMutationsDto.prototype, "mutations", void 0);
//# sourceMappingURL=apply-sync-mutations.dto.js.map