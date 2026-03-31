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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lab_date_util_1 = require("../common/utils/lab-date.util");
const number_util_1 = require("../common/utils/number.util");
const person_util_1 = require("../common/utils/person.util");
const search_normalization_util_1 = require("../common/utils/search-normalization.util");
const service_order_entity_1 = require("./entities/service-order.entity");
const patient_entity_1 = require("../patients/entities/patient.entity");
const doctor_entity_1 = require("../doctors/entities/doctor.entity");
const study_entity_1 = require("../studies/entities/study.entity");
const database_dialect_service_1 = require("../database/database-dialect.service");
const runtime_policy_service_1 = require("../runtime/runtime-policy.service");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const bwipjs = require("bwip-js");
const LAB_TIME_ZONE = 'America/Mexico_City';
const AUTO_SERVICE_FOLIO_PREFIX = 'ECO';
const AUTO_SEQUENCE_PAD = 4;
let ServicesService = class ServicesService {
    serviceRepo;
    itemRepo;
    patientRepo;
    doctorRepo;
    studyRepo;
    configService;
    databaseDialect;
    runtimePolicy;
    constructor(serviceRepo, itemRepo, patientRepo, doctorRepo, studyRepo, configService, databaseDialect, runtimePolicy) {
        this.serviceRepo = serviceRepo;
        this.itemRepo = itemRepo;
        this.patientRepo = patientRepo;
        this.doctorRepo = doctorRepo;
        this.studyRepo = studyRepo;
        this.configService = configService;
        this.databaseDialect = databaseDialect;
        this.runtimePolicy = runtimePolicy;
    }
    toNumber(value) {
        return (0, number_util_1.toFiniteNumber)(value);
    }
    getLabBillingDocumentConfig() {
        const lab = this.configService.getOrThrow('lab');
        return {
            name: lab.name,
            subtitle: lab.subtitle,
            address: lab.address,
            addressLine2: lab.addressLine2,
            phone: lab.phone,
            email: lab.email,
            logoPath: lab.logoPath ?? '',
        };
    }
    getPriceByType(study, type) {
        switch (type) {
            case service_order_entity_1.ServiceItemPriceType.DIF:
                return this.toNumber(study.difPrice);
            case service_order_entity_1.ServiceItemPriceType.SPECIAL:
                return this.toNumber(study.specialPrice);
            case service_order_entity_1.ServiceItemPriceType.HOSPITAL:
                return this.toNumber(study.hospitalPrice);
            case service_order_entity_1.ServiceItemPriceType.OTHER:
                return this.toNumber(study.otherPrice);
            case service_order_entity_1.ServiceItemPriceType.NORMAL:
            default:
                return this.toNumber(study.normalPrice);
        }
    }
    formatDateShort(value) {
        if (!value)
            return 'N/D';
        try {
            return new Date(value).toLocaleDateString('es-MX');
        }
        catch {
            return new Date(value).toISOString().slice(0, 10);
        }
    }
    formatReceiptDateTime(value) {
        if (!value)
            return 'N/D';
        const date = new Date(value);
        if (Number.isNaN(date.getTime()))
            return 'N/D';
        const pad = (segment) => String(segment).padStart(2, '0');
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    formatMoney(value) {
        const amount = this.toNumber(value);
        return `$ ${amount.toFixed(2)}`;
    }
    normalizeSearchText(value) {
        return (0, search_normalization_util_1.normalizeCompactSearchText)(value);
    }
    sqlNormalizedExpression(expression) {
        return this.databaseDialect.buildCompactSearchExpression(expression);
    }
    get isSqlite() {
        return this.databaseDialect.type === 'sqlite';
    }
    getLabDateToken(date = new Date()) {
        return (0, lab_date_util_1.getLabDateToken)(LAB_TIME_ZONE, date);
    }
    buildAutoServiceFolio(sequence, date = new Date()) {
        return `${AUTO_SERVICE_FOLIO_PREFIX}${this.getLabDateToken(date)}${String(sequence).padStart(AUTO_SEQUENCE_PAD, '0')}`;
    }
    extractAutoSequenceValue(value, dateToken) {
        if (!value)
            return 0;
        const match = new RegExp(`^${AUTO_SERVICE_FOLIO_PREFIX}${dateToken}(\\d{${AUTO_SEQUENCE_PAD}})$`, 'i').exec(value.trim());
        return match ? Number(match[1]) : 0;
    }
    isUniqueConstraintError(error) {
        if (!(error instanceof typeorm_2.QueryFailedError)) {
            return false;
        }
        const driverError = error.driverError;
        return (driverError?.code === '23505' ||
            driverError?.code === 'SQLITE_CONSTRAINT' ||
            driverError?.errno === 19);
    }
    async getNextAutoServiceFolio(date = new Date()) {
        const dateToken = this.getLabDateToken(date);
        const prefix = `${AUTO_SERVICE_FOLIO_PREFIX}${dateToken}%`;
        const latest = await this.serviceRepo
            .createQueryBuilder('service')
            .where('service.folio LIKE :prefix', { prefix })
            .orderBy('service.folio', 'DESC')
            .getOne();
        const nextSequence = this.extractAutoSequenceValue(latest?.folio, dateToken) + 1;
        return this.buildAutoServiceFolio(nextSequence, date);
    }
    normalizeServiceFolio(folio) {
        const normalized = folio?.trim().toUpperCase();
        return normalized ? normalized : null;
    }
    calculateTotals(subtotal, courtesyPercent) {
        const discountAmount = subtotal * (courtesyPercent / 100);
        return {
            discountAmount,
            totalAmount: subtotal - discountAmount,
        };
    }
    async findActivePatientOrFail(patientId, message) {
        const patient = await this.patientRepo.findOne({
            where: { id: patientId, isActive: true },
        });
        if (!patient) {
            throw new common_1.NotFoundException(message);
        }
        return patient;
    }
    async findActiveDoctorOrFail(doctorId, message) {
        const doctor = await this.doctorRepo.findOne({
            where: { id: doctorId, isActive: true },
        });
        if (!doctor) {
            throw new common_1.NotFoundException(message);
        }
        return doctor;
    }
    async getSuggestedFolio() {
        return { folio: await this.getNextAutoServiceFolio() };
    }
    mapPriceTypeLabel(type) {
        switch (type) {
            case service_order_entity_1.ServiceItemPriceType.DIF:
                return 'DIF';
            case service_order_entity_1.ServiceItemPriceType.SPECIAL:
                return 'Especial';
            case service_order_entity_1.ServiceItemPriceType.HOSPITAL:
                return 'Hospital';
            case service_order_entity_1.ServiceItemPriceType.OTHER:
                return 'Otro';
            case service_order_entity_1.ServiceItemPriceType.NORMAL:
            default:
                return 'Normal';
        }
    }
    formatGenderLabel(gender) {
        switch (gender) {
            case patient_entity_1.PatientGender.MALE:
            case 'male':
                return 'Masculino';
            case patient_entity_1.PatientGender.FEMALE:
            case 'female':
                return 'Femenino';
            case patient_entity_1.PatientGender.OTHER:
            case 'other':
                return 'Otro';
            default:
                return 'N/D';
        }
    }
    truncateText(text, max = 40) {
        if (!text)
            return '';
        if (text.length <= max)
            return text;
        return `${text.slice(0, Math.max(0, max - 3))}...`;
    }
    buildReceiptBarcodeText(service) {
        const patient = service.patient;
        const patientTag = this.sanitizeBarcodeToken(`${patient?.lastName ?? ''}${patient?.firstName ?? ''}`, 8);
        return `${service.folio ?? service.id}-${patientTag}-REC-${service.id}`;
    }
    async buildBarcodeBuffer(text, height = 10, scale = 2) {
        try {
            return await bwipjs.toBuffer({
                bcid: 'code128',
                text,
                scale,
                height,
                includetext: false,
            });
        }
        catch {
            return null;
        }
    }
    sanitizeBarcodeToken(text, max = 10) {
        if (!text)
            return 'NA';
        const cleaned = text
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, max);
        return cleaned || 'NA';
    }
    async buildReceiptPdfBuffer(service) {
        const lab = this.getLabBillingDocumentConfig();
        const labName = lab.name;
        const labSubtitle = lab.subtitle;
        const labAddress = lab.address;
        const labAddress2 = lab.addressLine2;
        const labPhone = lab.phone;
        const labEmail = lab.email;
        const logoPath = lab.logoPath;
        const patient = service.patient;
        const barcodeText = this.buildReceiptBarcodeText(service);
        const barcodeBuffer = await this.buildBarcodeBuffer(barcodeText, 12, 2);
        const patientName = (0, person_util_1.buildPersonName)(patient?.firstName, patient?.lastName, patient?.middleName);
        const genderLabel = this.formatGenderLabel(patient?.gender);
        const branchLabel = service.branchName?.trim() || 'N/D';
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
            const chunks = [];
            const drawImageIfValid = (imagePath, x, y, options) => {
                if (!imagePath || !fs.existsSync(imagePath))
                    return false;
                try {
                    doc.image(imagePath, x, y, options);
                    return true;
                }
                catch {
                    return false;
                }
            };
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('error', (err) => reject(err instanceof Error
                ? err
                : new Error('No se pudo generar el recibo PDF.')));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            const left = 40;
            const right = doc.page.width - left;
            const pageBottom = doc.page.height - 40;
            const headerY = 40;
            const headerCenterX = 150;
            const headerCenterWidth = 228;
            const barcodeBoxWidth = 180;
            const barcodeBoxX = right - barcodeBoxWidth;
            const barcodeImageY = headerY + 50;
            const metaLeftX = left;
            const metaLeftWidth = 228;
            const metaMiddleX = 286;
            const metaMiddleWidth = 170;
            const metaRightX = 462;
            const metaRightWidth = right - metaRightX;
            const hasLogo = drawImageIfValid(logoPath, left, headerY + 6, {
                fit: [96, 54],
            });
            if (!hasLogo) {
                doc
                    .rect(left, headerY + 6, 96, 54)
                    .strokeColor('#cccccc')
                    .stroke();
                doc
                    .font('Helvetica')
                    .fontSize(8)
                    .fillColor('#666666')
                    .text('LOGO', left, headerY + 26, {
                    width: 96,
                    align: 'center',
                })
                    .fillColor('black');
            }
            doc
                .font('Helvetica-Bold')
                .fontSize(16)
                .text(labName, headerCenterX, headerY + 2, {
                width: headerCenterWidth,
                align: 'center',
            });
            doc
                .font('Helvetica-Bold')
                .fontSize(8.7)
                .text(labSubtitle, headerCenterX, headerY + 22, {
                width: headerCenterWidth,
                align: 'center',
            });
            doc
                .font('Helvetica-Bold')
                .fontSize(8.5)
                .text(labAddress, headerCenterX, headerY + 35, {
                width: headerCenterWidth,
                align: 'center',
            });
            if (labAddress2) {
                doc
                    .font('Helvetica-Bold')
                    .fontSize(8.5)
                    .text(labAddress2, headerCenterX, headerY + 47, {
                    width: headerCenterWidth,
                    align: 'center',
                });
            }
            if (labPhone) {
                doc
                    .font('Helvetica-Bold')
                    .fontSize(8.5)
                    .text(`TELEFONO ${labPhone}`, headerCenterX, headerY + 59, {
                    width: headerCenterWidth,
                    align: 'center',
                });
            }
            doc
                .font('Helvetica-Bold')
                .fontSize(12)
                .text('FOLIO', barcodeBoxX, headerY + 2, {
                width: barcodeBoxWidth,
                align: 'right',
            });
            doc.text(service.folio ?? '', barcodeBoxX, headerY + 22, {
                width: barcodeBoxWidth,
                align: 'right',
            });
            if (barcodeBuffer) {
                doc.image(barcodeBuffer, barcodeBoxX, barcodeImageY, {
                    width: barcodeBoxWidth,
                    height: 24,
                });
                doc
                    .font('Helvetica')
                    .fontSize(8)
                    .text(barcodeText, barcodeBoxX, barcodeImageY + 27, {
                    width: barcodeBoxWidth,
                    align: 'center',
                });
            }
            doc
                .font('Helvetica')
                .fontSize(7.5)
                .text(this.truncateText(patientName.toUpperCase() || 'PACIENTE N/D', 30), barcodeBoxX, barcodeImageY + 40, {
                width: barcodeBoxWidth,
            })
                .text(`${genderLabel} - ${(0, person_util_1.formatAgeLabel)(patient?.birthDate)}`, barcodeBoxX, barcodeImageY + 53, {
                width: barcodeBoxWidth,
            });
            doc.moveTo(left, 164).lineTo(right, 164).strokeColor('#999999').stroke();
            doc.font('Helvetica-Bold').fontSize(9);
            doc.text(`PACIENTE: ${patientName || 'N/D'}`, metaLeftX, 178, {
                width: metaLeftWidth,
            });
            doc.text(`TELEFONO: ${patient?.phone ?? 'N/D'}`, metaLeftX, 196, {
                width: metaLeftWidth,
            });
            doc.text(`DIRECCION: ${patient?.addressLine ?? 'N/D'}`, metaLeftX, 214, {
                width: metaLeftWidth,
            });
            doc.text(`ENTRE CALLES: ${patient?.addressBetween ?? 'N/D'}`, metaLeftX, 232, {
                width: metaLeftWidth,
            });
            doc.text(`FECHA: ${this.formatReceiptDateTime(service.createdAt)}`, metaMiddleX, 178, {
                width: metaMiddleWidth,
            });
            doc.text(`EDAD: ${(0, person_util_1.formatAgeLabel)(patient?.birthDate)}`, metaMiddleX, 196, {
                width: metaMiddleWidth,
            });
            doc.text(`SEXO: ${genderLabel}`, metaMiddleX, 214, {
                width: metaMiddleWidth,
            });
            doc.text(`FECHA DE ENTREGA: ${this.formatReceiptDateTime(service.deliveryAt)}`, metaMiddleX, 232, { width: metaMiddleWidth });
            doc.font('Helvetica-Bold').fontSize(10);
            doc.text(`SUC: ${branchLabel}`, metaRightX, 192, {
                width: metaRightWidth,
            });
            doc.text(`FOLIO: ${service.folio ?? 'N/D'}`, metaRightX, 210, {
                width: metaRightWidth,
            });
            doc.moveTo(left, 252).lineTo(right, 252).strokeColor('#999999').stroke();
            const colX = {
                name: left + 8,
                type: 286,
                price: 360,
                discount: 442,
                total: 516,
            };
            const tableY = 262;
            doc
                .font('Helvetica-Bold')
                .fontSize(11)
                .text('ANALISIS CLINICO', colX.name, tableY, { width: 234 })
                .text('TP', colX.type, tableY, { width: 44 })
                .text('PRECIO', colX.price, tableY, { width: 70, align: 'center' })
                .text('DESC.', colX.discount, tableY, { width: 56, align: 'center' })
                .text('TOTAL', colX.total, tableY, { width: 48, align: 'right' });
            doc
                .moveTo(left + 8, tableY + 22)
                .lineTo(right, tableY + 22)
                .strokeColor('#999999')
                .stroke();
            let rowY = tableY + 32;
            doc.font('Helvetica').fontSize(10);
            for (const item of service.items ?? []) {
                const lineTotal = this.toNumber(item.subtotalAmount);
                const unitPrice = this.toNumber(item.unitPrice);
                const itemDiscount = this.toNumber(item.discountPercent);
                doc.text(this.truncateText(item.studyNameSnapshot ?? '', 40), colX.name, rowY, { width: 234 });
                doc
                    .fontSize(8)
                    .text(`DESCRIPCION: ${this.truncateText(item.studyNameSnapshot ?? '', 44)}`, colX.name, rowY + 12, { width: 234 });
                doc
                    .fontSize(10)
                    .text(this.mapPriceTypeLabel(item.priceType), colX.type, rowY + 4, {
                    width: 44,
                });
                doc.text(this.formatMoney(unitPrice), colX.price, rowY + 4, {
                    width: 70,
                    align: 'right',
                });
                doc.text(`${itemDiscount} %`, colX.discount, rowY + 4, {
                    width: 56,
                    align: 'right',
                });
                doc.text(this.formatMoney(lineTotal), colX.total, rowY + 4, {
                    width: 48,
                    align: 'right',
                });
                rowY += 34;
            }
            doc.font('Helvetica').fontSize(9);
            const subtotal = this.toNumber(service.subtotalAmount);
            const courtesy = this.toNumber(service.courtesyPercent);
            const discount = this.toNumber(service.discountAmount);
            const total = this.toNumber(service.totalAmount);
            let totalsY = Math.max(rowY + 24, pageBottom - 104);
            doc
                .moveTo(398, totalsY - 8)
                .lineTo(right, totalsY - 6)
                .strokeColor('#999999')
                .stroke();
            doc.text('SUBTOTAL:', 446, totalsY, { width: 70, align: 'right' });
            doc.text(this.formatMoney(subtotal), 516, totalsY, {
                width: 48,
                align: 'right',
            });
            totalsY += 16;
            doc.text('CORTESIA:', 446, totalsY, { width: 70, align: 'right' });
            doc.text(`${courtesy} %`, 516, totalsY, {
                width: 48,
                align: 'right',
            });
            totalsY += 16;
            doc.text('DESC. TOTAL:', 446, totalsY, { width: 70, align: 'right' });
            doc.text(this.formatMoney(discount), 516, totalsY, {
                width: 48,
                align: 'right',
            });
            totalsY += 16;
            doc
                .font('Helvetica-Bold')
                .text('TOTAL:', 446, totalsY, { width: 70, align: 'right' });
            doc.text(this.formatMoney(total), 516, totalsY, {
                width: 48,
                align: 'right',
            });
            doc.font('Helvetica');
            const footerY = pageBottom - 18;
            if (labPhone) {
                doc.fontSize(8).text(`Telefono: ${labPhone}`, left, footerY - 12);
            }
            if (labEmail) {
                doc.text(`Correo: ${labEmail}`, left, footerY);
            }
            doc.end();
        });
    }
    async buildTicketPdfBuffer(service) {
        const lab = this.getLabBillingDocumentConfig();
        const labName = lab.name;
        const labSubtitle = lab.subtitle;
        const labAddress = lab.address;
        const labAddress2 = lab.addressLine2;
        const labPhone = lab.phone;
        const logoPath = lab.logoPath;
        const patient = service.patient;
        const patientName = (0, person_util_1.buildPersonName)(patient?.firstName, patient?.lastName, patient?.middleName) || 'N/D';
        const genderLabel = this.formatGenderLabel(patient?.gender);
        const ticketWidth = 226.77;
        const itemCount = service.items?.length ?? 0;
        const ticketHeight = Math.max(420, 300 + itemCount * 28);
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                margin: 14,
                size: [ticketWidth, ticketHeight],
            });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('error', (err) => reject(err instanceof Error
                ? err
                : new Error('No se pudo generar el ticket PDF.')));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            if (logoPath && fs.existsSync(logoPath)) {
                try {
                    doc.image(logoPath, (ticketWidth - 86) / 2, 16, { fit: [86, 42] });
                }
                catch {
                }
            }
            const contentWidth = ticketWidth - 28;
            doc
                .font('Helvetica-Bold')
                .fontSize(6.6)
                .text(labName, 14, 66, { width: contentWidth, align: 'center' });
            doc.fontSize(6.05).text(labSubtitle, 14, 76, {
                width: contentWidth,
                align: 'center',
            });
            doc.text(labAddress, 14, 85, {
                width: contentWidth,
                align: 'center',
            });
            if (labAddress2) {
                doc.text(labAddress2, 14, 93, {
                    width: contentWidth,
                    align: 'center',
                });
            }
            if (labPhone) {
                doc.text(`TEL. ${labPhone}`, 14, 101, {
                    width: contentWidth,
                    align: 'center',
                });
            }
            let y = 116;
            doc.font('Helvetica-Bold').fontSize(6.8);
            doc.text(`FOLIO ${service.folio ?? ''}`, 14, y, { width: 104 });
            doc.text(`SUC: ${service.branchName ?? ''}`, 118, y, {
                width: 94,
                align: 'right',
            });
            doc.font('Helvetica').fontSize(6.6);
            y += 10;
            doc.text(`FECHA: ${this.formatReceiptDateTime(service.createdAt)}`, 14, y, {
                width: contentWidth,
            });
            y += 11;
            doc
                .font('Helvetica-Bold')
                .text(`PACIENTE: ${this.truncateText(patientName, 28)}`, 14, y, {
                width: contentWidth,
            });
            y += 10;
            doc.font('Helvetica');
            doc.text(`EDAD: ${(0, person_util_1.formatAgeLabel)(patient?.birthDate)}`, 14, y, {
                width: 100,
            });
            doc.text(`SEXO: ${genderLabel}`, 118, y, {
                width: 94,
                align: 'right',
            });
            y += 10;
            doc.text(`TEL: ${patient?.phone ?? 'N/D'}`, 14, y, {
                width: contentWidth,
            });
            y += 10;
            doc.text(`DIRECCION: ${this.truncateText(patient?.addressLine ?? 'N/D', 28)}`, 14, y, { width: contentWidth });
            y += 10;
            doc.text(`ENTRE CALLES: ${this.truncateText(patient?.addressBetween ?? 'N/D', 26)}`, 14, y, { width: contentWidth });
            y += 10;
            doc.text(`FECHA DE ENTREGA: ${this.formatReceiptDateTime(service.deliveryAt)}`, 14, y, { width: contentWidth });
            y += 12;
            doc
                .moveTo(14, y)
                .lineTo(ticketWidth - 14, y)
                .strokeColor('#999999')
                .stroke();
            y += 6;
            doc.font('Helvetica-Bold').fontSize(6.8);
            doc.text('ANALISIS CLINICO', 14, y, { width: 88 });
            doc.text('TP', 102, y, { width: 28 });
            doc.text('PRECIO', 132, y, { width: 28, align: 'right' });
            doc.text('DESC.', 160, y, { width: 22, align: 'right' });
            doc.text('TOTAL', 184, y, { width: 28, align: 'right' });
            y += 8;
            doc
                .moveTo(14, y)
                .lineTo(ticketWidth - 14, y)
                .strokeColor('#999999')
                .stroke();
            y += 4;
            doc.font('Helvetica').fontSize(6.6);
            for (const item of service.items ?? []) {
                const lineTotal = this.toNumber(item.subtotalAmount);
                const unitPrice = this.toNumber(item.unitPrice);
                const itemDiscount = this.toNumber(item.discountPercent);
                const studyName = this.truncateText(item.studyNameSnapshot ?? '', 28);
                const description = `DESCRIPCION: ${this.truncateText(item.studyNameSnapshot ?? '', 34)}`;
                const studyHeight = doc.heightOfString(studyName, { width: 88 });
                doc.text(studyName, 14, y, {
                    width: 88,
                });
                doc.text(this.mapPriceTypeLabel(item.priceType), 102, y, {
                    width: 28,
                });
                doc.text(this.formatMoney(unitPrice), 132, y, {
                    width: 28,
                    align: 'right',
                });
                doc.text(`${itemDiscount} %`, 160, y, { width: 22, align: 'right' });
                doc.text(this.formatMoney(lineTotal), 184, y, {
                    width: 28,
                    align: 'right',
                });
                y += Math.max(8, studyHeight);
                doc
                    .fontSize(5.8)
                    .fillColor('#555555')
                    .text(description, 20, y, { width: 84 });
                doc.fontSize(6.6).fillColor('black');
                y += doc.heightOfString(description, { width: 84 }) + 4;
            }
            const subtotal = this.toNumber(service.subtotalAmount);
            const courtesy = this.toNumber(service.courtesyPercent);
            const discount = this.toNumber(service.discountAmount);
            const total = this.toNumber(service.totalAmount);
            y += 8;
            doc
                .moveTo(110, y - 4)
                .lineTo(ticketWidth - 14, y - 4)
                .strokeColor('#999999')
                .stroke();
            doc.text('SUBTOTAL:', 126, y, { width: 56, align: 'right' });
            doc.text(this.formatMoney(subtotal), 184, y, {
                width: 28,
                align: 'right',
            });
            y += 9;
            doc.text('CORTESIA:', 126, y, { width: 56, align: 'right' });
            doc.text(`${courtesy} %`, 184, y, { width: 28, align: 'right' });
            y += 9;
            doc.text('DESC. TOTAL:', 126, y, { width: 56, align: 'right' });
            doc.text(this.formatMoney(discount), 184, y, {
                width: 28,
                align: 'right',
            });
            y += 9;
            doc
                .font('Helvetica-Bold')
                .text('TOTAL:', 126, y, { width: 56, align: 'right' });
            doc.text(this.formatMoney(total), 184, y, { width: 28, align: 'right' });
            doc.end();
        });
    }
    async buildLabelsPdfBuffer(service) {
        const { name: labName } = this.getLabBillingDocumentConfig();
        const patient = service.patient;
        const sampleAt = service.sampleAt ?? service.createdAt;
        const studyIds = (service.items ?? []).map((item) => item.studyId);
        const studies = await this.studyRepo.findByIds(studyIds);
        const studyMap = new Map();
        studies.forEach((s) => studyMap.set(s.id, s));
        const labels = [];
        for (const item of service.items ?? []) {
            const study = studyMap.get(item.studyId);
            const studyCode = study?.code ?? String(item.studyId);
            const patientTag = this.sanitizeBarcodeToken(`${patient?.lastName ?? ''}${patient?.firstName ?? ''}`, 8);
            const studyTag = this.sanitizeBarcodeToken(study?.code ?? item.studyNameSnapshot ?? String(item.studyId), 8);
            const barcodeText = `${service.folio ?? service.id}-${patientTag}-${studyTag}-${item.id}`;
            labels.push({ item, barcode: barcodeText, studyCode });
        }
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 24, size: 'LETTER' });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('error', (err) => reject(err instanceof Error
                ? err
                : new Error('No se pudieron generar las etiquetas PDF.')));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            const pageHeight = doc.page.height;
            const labelWidth = 180;
            const labelHeight = 80;
            const gapX = 8;
            const gapY = 8;
            const startX = 24;
            const startY = 30;
            const cols = 3;
            const rowsPerPage = Math.floor((pageHeight - startY * 2 + gapY) / (labelHeight + gapY));
            let index = 0;
            const drawLabel = async (x, y, item, barcodeText, studyCode) => {
                const paddingX = 7;
                const contentWidth = labelWidth - paddingX * 2;
                const barcodeWidth = labelWidth - 20;
                const barcodeX = x + (labelWidth - barcodeWidth) / 2;
                const labY = y + 5;
                const patientY = y + 15;
                const demographicY = y + 26;
                const studyY = y + 36;
                const folioY = y + 46;
                const sampleY = y + 55;
                const barcodeY = y + 62;
                const barcodeTextY = y + 73;
                doc.rect(x, y, labelWidth, labelHeight).strokeColor('#dddddd').stroke();
                const patientName = (0, person_util_1.buildPersonName)(patient?.firstName, patient?.lastName, patient?.middleName) || 'N/D';
                const gender = this.formatGenderLabel(patient?.gender);
                const age = (0, person_util_1.formatAgeLabel)(patient?.birthDate);
                doc
                    .font('Helvetica-Bold')
                    .fontSize(7)
                    .text(labName, x + paddingX, labY, {
                    width: contentWidth,
                    lineBreak: false,
                });
                doc
                    .font('Helvetica-Bold')
                    .fontSize(8)
                    .text(this.truncateText(patientName, 28), x + paddingX, patientY, {
                    width: contentWidth,
                    lineBreak: false,
                });
                doc
                    .font('Helvetica')
                    .fontSize(7)
                    .text(`Sexo: ${gender}  Edad: ${age}`, x + paddingX, demographicY, {
                    width: contentWidth,
                    lineBreak: false,
                });
                doc
                    .font('Helvetica')
                    .fontSize(7)
                    .text(`Estudio: ${this.truncateText(item.studyNameSnapshot ?? studyCode, 26)}`, x + paddingX, studyY, {
                    width: contentWidth,
                    lineBreak: false,
                });
                doc
                    .font('Helvetica')
                    .fontSize(7)
                    .text(`Folio: ${service.folio ?? service.id}`, x + paddingX, folioY, {
                    width: contentWidth,
                    lineBreak: false,
                })
                    .text(`Muestra: ${this.formatDateShort(sampleAt)}`, x + paddingX, sampleY, {
                    width: contentWidth,
                    lineBreak: false,
                });
                const barcodeBuffer = await this.buildBarcodeBuffer(barcodeText, 8);
                if (barcodeBuffer) {
                    doc.image(barcodeBuffer, barcodeX, barcodeY, {
                        width: barcodeWidth,
                        height: 10,
                    });
                }
                doc
                    .font('Helvetica')
                    .fontSize(5)
                    .text(barcodeText, x + paddingX, barcodeTextY, {
                    width: contentWidth,
                    align: 'center',
                    lineBreak: false,
                });
            };
            const renderLabels = async () => {
                for (const label of labels) {
                    if (index > 0 && index % (cols * rowsPerPage) === 0) {
                        doc.addPage();
                    }
                    const localIndex = index % (cols * rowsPerPage);
                    const row = Math.floor(localIndex / cols);
                    const col = localIndex % cols;
                    const x = startX + col * (labelWidth + gapX);
                    const y = startY + row * (labelHeight + gapY);
                    await drawLabel(x, y, label.item, label.barcode, label.studyCode);
                    index += 1;
                }
            };
            renderLabels()
                .then(() => {
                doc.end();
            })
                .catch((err) => reject(err instanceof Error
                ? err
                : new Error('No se pudieron renderizar las etiquetas.')));
        });
    }
    async buildServiceItems(dtoItems) {
        if (!dtoItems || dtoItems.length === 0) {
            throw new common_1.BadRequestException('Debe agregar al menos un analisis al servicio.');
        }
        const studyIds = dtoItems.map((item) => item.studyId);
        const studies = await this.studyRepo.findByIds(studyIds);
        if (studies.length !== studyIds.length) {
            throw new common_1.NotFoundException('Uno o mas estudios no existen o estan inactivos.');
        }
        const studyMap = new Map();
        studies.forEach((study) => studyMap.set(study.id, study));
        const items = [];
        let subtotal = 0;
        for (const itemDto of dtoItems) {
            const study = studyMap.get(itemDto.studyId);
            const quantity = itemDto.quantity;
            const itemDiscount = itemDto.discountPercent ?? 0;
            if (!study.isActive || study.status !== study_entity_1.StudyStatus.ACTIVE) {
                throw new common_1.BadRequestException(`El estudio "${study.name}" no esta disponible para nuevos servicios.`);
            }
            if (study.type === study_entity_1.StudyType.PACKAGE) {
                const componentIds = study.packageStudyIds ?? [];
                if (componentIds.length === 0) {
                    throw new common_1.BadRequestException(`El paquete "${study.name}" no tiene estudios asociados.`);
                }
                const componentStudies = await this.studyRepo.findByIds(componentIds);
                if (componentStudies.length !== componentIds.length) {
                    throw new common_1.NotFoundException(`Uno o mas estudios del paquete "${study.name}" no existen.`);
                }
                const invalidComponent = componentStudies.find((component) => !component.isActive ||
                    component.status !== study_entity_1.StudyStatus.ACTIVE ||
                    component.type !== study_entity_1.StudyType.STUDY);
                if (invalidComponent) {
                    throw new common_1.BadRequestException(`El paquete "${study.name}" contiene estudios no disponibles.`);
                }
                const orderedComponents = componentIds
                    .map((componentId) => componentStudies.find((component) => component.id === componentId))
                    .filter((component) => Boolean(component));
                const packageUnitPrice = this.getPriceByType(study, itemDto.priceType);
                const packageLineBase = packageUnitPrice * quantity;
                const packageLineSubtotal = packageLineBase * (1 - itemDiscount / 100);
                subtotal += packageLineSubtotal;
                orderedComponents.forEach((component, index) => {
                    const isPricedLine = index === 0;
                    items.push(this.itemRepo.create({
                        studyId: component.id,
                        studyNameSnapshot: component.name,
                        sourcePackageId: study.id,
                        sourcePackageNameSnapshot: study.name,
                        priceType: itemDto.priceType,
                        unitPrice: isPricedLine ? packageUnitPrice : 0,
                        quantity,
                        discountPercent: isPricedLine ? itemDiscount : 0,
                        subtotalAmount: isPricedLine ? packageLineSubtotal : 0,
                    }));
                });
                continue;
            }
            const unitPrice = this.getPriceByType(study, itemDto.priceType);
            const lineBase = unitPrice * quantity;
            const lineSubtotal = lineBase * (1 - itemDiscount / 100);
            subtotal += lineSubtotal;
            items.push(this.itemRepo.create({
                publicId: itemDto.publicId ?? null,
                studyId: study.id,
                studyNameSnapshot: study.name,
                priceType: itemDto.priceType,
                unitPrice,
                quantity,
                discountPercent: itemDiscount,
                subtotalAmount: lineSubtotal,
            }));
        }
        return { items, subtotal };
    }
    getServiceItemIdentityKey(item) {
        const packageScope = item.sourcePackageId
            ? `pkg:${item.sourcePackageId}`
            : 'single';
        const packageRole = item.sourcePackageId
            ? this.toNumber(item.unitPrice) > 0
                ? 'priced'
                : 'shadow'
            : 'single';
        return `${packageScope}:${item.studyId}:${item.priceType}:${packageRole}`;
    }
    reconcileServiceItems(existingItems, preparedItems) {
        const existingByPublicId = new Map(existingItems
            .filter((item) => Boolean(item.publicId))
            .map((item) => [item.publicId, item]));
        const existingBuckets = new Map();
        const usedItemIds = new Set();
        for (const item of [...existingItems].sort((a, b) => a.id - b.id)) {
            const key = this.getServiceItemIdentityKey(item);
            const bucket = existingBuckets.get(key) ?? [];
            bucket.push(item);
            existingBuckets.set(key, bucket);
        }
        const takeNextBucketMatch = (preparedItem) => {
            const key = this.getServiceItemIdentityKey(preparedItem);
            const bucket = existingBuckets.get(key) ?? [];
            while (bucket.length > 0) {
                const candidate = bucket.shift();
                if (!usedItemIds.has(candidate.id)) {
                    return candidate;
                }
            }
            return undefined;
        };
        const items = preparedItems.map((preparedItem) => {
            let matched = (preparedItem.publicId
                ? existingByPublicId.get(preparedItem.publicId)
                : undefined) ?? takeNextBucketMatch(preparedItem);
            if (matched && usedItemIds.has(matched.id)) {
                matched = takeNextBucketMatch(preparedItem);
            }
            if (!matched) {
                return preparedItem;
            }
            usedItemIds.add(matched.id);
            return this.itemRepo.merge(matched, {
                ...preparedItem,
                publicId: matched.publicId ?? preparedItem.publicId ?? null,
                deletedAt: null,
            });
        });
        const removedItemIds = existingItems
            .filter((item) => !usedItemIds.has(item.id))
            .map((item) => item.id);
        return { items, removedItemIds };
    }
    async create(dto) {
        await this.findActivePatientOrFail(dto.patientId, 'El paciente no existe o está inactivo.');
        if (dto.doctorId) {
            await this.findActiveDoctorOrFail(dto.doctorId, 'El médico no existe o está inactivo.');
        }
        const preparedItems = await this.buildServiceItems(dto.items);
        const preparedCourtesyPercent = dto.courtesyPercent ?? 0;
        const { discountAmount: preparedDiscountAmount, totalAmount: preparedTotalAmount, } = this.calculateTotals(preparedItems.subtotal, preparedCourtesyPercent);
        const manualFolio = this.normalizeServiceFolio(dto.folio);
        const useAutoFolio = dto.autoGenerateFolio ?? false;
        if (!useAutoFolio && !manualFolio) {
            throw new common_1.BadRequestException('El folio es obligatorio o activa la generacion automatica.');
        }
        const saveService = async (folio) => {
            const nextServiceEntity = this.serviceRepo.create({
                folio,
                patientId: dto.patientId,
                doctorId: dto.doctorId,
                branchName: dto.branchName,
                sampleAt: dto.sampleAt ? new Date(dto.sampleAt) : undefined,
                deliveryAt: dto.deliveryAt ? new Date(dto.deliveryAt) : undefined,
                status: dto.status ?? service_order_entity_1.ServiceStatus.PENDING,
                completedAt: dto.status === service_order_entity_1.ServiceStatus.COMPLETED ? new Date() : undefined,
                courtesyPercent: preparedCourtesyPercent,
                subtotalAmount: preparedItems.subtotal,
                discountAmount: preparedDiscountAmount,
                totalAmount: preparedTotalAmount,
                notes: dto.notes,
                items: preparedItems.items,
            });
            return this.serviceRepo.save(nextServiceEntity);
        };
        if (!useAutoFolio && manualFolio) {
            const existing = await this.serviceRepo.findOne({
                where: { folio: manualFolio },
            });
            if (existing) {
                throw new common_1.ConflictException('Ya existe un servicio con este folio.');
            }
            try {
                return await saveService(manualFolio);
            }
            catch (error) {
                if (this.isUniqueConstraintError(error)) {
                    throw new common_1.ConflictException('Ya existe un servicio con este folio.');
                }
                throw error;
            }
        }
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const nextFolio = await this.getNextAutoServiceFolio();
            try {
                return await saveService(nextFolio);
            }
            catch (error) {
                if (!this.isUniqueConstraintError(error)) {
                    throw error;
                }
            }
        }
        throw new common_1.ConflictException('No se pudo generar un folio automatico. Intenta de nuevo.');
    }
    async findOne(id) {
        const service = await this.serviceRepo.findOne({
            where: { id, isActive: true },
        });
        if (!service) {
            throw new common_1.NotFoundException('Servicio no encontrado.');
        }
        return service;
    }
    async findByFolio(folio) {
        const service = await this.serviceRepo.findOne({
            where: { folio, isActive: true },
        });
        if (!service) {
            throw new common_1.NotFoundException('Servicio no encontrado.');
        }
        return service;
    }
    async search(params) {
        const { search, status, branchName, fromDate, toDate } = params;
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 10;
        const qb = this.serviceRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.patient', 'p')
            .leftJoinAndSelect('s.doctor', 'd')
            .leftJoinAndSelect('s.items', 'i')
            .where('s.isActive = :active', { active: true })
            .distinct(true);
        if (status) {
            qb.andWhere('s.status = :status', { status });
        }
        if (branchName) {
            qb.andWhere('s.branchName = :branchName', { branchName });
        }
        if (fromDate) {
            qb.andWhere('s.createdAt >= :from', {
                from: new Date(fromDate),
            });
        }
        if (toDate) {
            const endDate = new Date(toDate);
            endDate.setHours(23, 59, 59, 999);
            qb.andWhere('s.createdAt <= :to', {
                to: endDate,
            });
        }
        const normalizedSearch = this.normalizeSearchText(search);
        if (this.isSqlite) {
            qb.orderBy('s.createdAt', 'DESC');
            const rows = await qb.getMany();
            const filtered = !normalizedSearch
                ? rows
                : rows.filter((service) => {
                    const patientName = service.patient
                        ? `${service.patient.firstName} ${service.patient.lastName} ${service.patient.middleName ?? ''}`
                        : '';
                    const studyNames = (service.items ?? [])
                        .map((item) => item.studyNameSnapshot ?? '')
                        .join(' ');
                    const haystack = this.normalizeSearchText(`${service.folio} ${patientName} ${studyNames}`);
                    return haystack.includes(normalizedSearch);
                });
            return {
                data: filtered.slice((page - 1) * limit, (page - 1) * limit + limit),
                meta: {
                    page,
                    limit,
                    total: filtered.length,
                },
            };
        }
        if (normalizedSearch) {
            qb.andWhere(`(
          ${this.sqlNormalizedExpression('s.folio')} LIKE :normalizedSearch
          OR ${this.sqlNormalizedExpression("concat_ws(' ', p.firstName, p.lastName, p.middleName)")} LIKE :normalizedSearch
          OR ${this.sqlNormalizedExpression('i.studyNameSnapshot')} LIKE :normalizedSearch
        )`, { normalizedSearch: `%${normalizedSearch}%` });
        }
        qb.orderBy('s.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: {
                page,
                limit,
                total,
            },
        };
    }
    async update(id, dto) {
        const service = await this.findOne(id);
        if (dto.patientId && dto.patientId !== service.patientId) {
            await this.findActivePatientOrFail(dto.patientId, 'El nuevo paciente no existe o está inactivo.');
        }
        if (dto.doctorId && dto.doctorId !== service.doctorId) {
            await this.findActiveDoctorOrFail(dto.doctorId, 'El nuevo médico no existe o está inactivo.');
        }
        let subtotal = this.toNumber(service.subtotalAmount);
        let nextItems = service.items;
        let removedItemIds = [];
        if (dto.items) {
            const preparedItems = await this.buildServiceItems(dto.items);
            subtotal = preparedItems.subtotal;
            const reconciliation = this.reconcileServiceItems(service.items ?? [], preparedItems.items);
            nextItems = reconciliation.items;
            removedItemIds = reconciliation.removedItemIds;
        }
        const nextCourtesyPercent = dto.courtesyPercent !== undefined
            ? dto.courtesyPercent
            : this.toNumber(service.courtesyPercent);
        const { discountAmount: nextDiscountAmount, totalAmount: nextTotalAmount } = this.calculateTotals(subtotal, nextCourtesyPercent);
        const manualFolio = this.normalizeServiceFolio(dto.folio);
        const useAutoFolio = dto.autoGenerateFolio ?? false;
        if (!useAutoFolio && manualFolio && manualFolio !== service.folio) {
            const existing = await this.serviceRepo.findOne({
                where: { folio: manualFolio },
            });
            if (existing && existing.id !== service.id) {
                throw new common_1.ConflictException('Ya existe otro servicio con este folio.');
            }
        }
        const saveService = async (folio) => {
            const savedId = await this.serviceRepo.manager.transaction(async (manager) => {
                const transactionalServiceRepo = manager.getRepository(service_order_entity_1.ServiceOrder);
                const transactionalItemRepo = manager.getRepository(service_order_entity_1.ServiceOrderItem);
                const nextService = transactionalServiceRepo.merge(service, {
                    folio,
                    patientId: dto.patientId ?? service.patientId,
                    doctorId: dto.doctorId ?? service.doctorId,
                    branchName: dto.branchName ?? service.branchName,
                    sampleAt: dto.sampleAt ? new Date(dto.sampleAt) : service.sampleAt,
                    deliveryAt: dto.deliveryAt
                        ? new Date(dto.deliveryAt)
                        : service.deliveryAt,
                    status: dto.status ?? service.status,
                    completedAt: dto.status === service_order_entity_1.ServiceStatus.COMPLETED
                        ? (service.completedAt ?? new Date())
                        : dto.status
                            ? undefined
                            : service.completedAt,
                    courtesyPercent: nextCourtesyPercent,
                    subtotalAmount: subtotal,
                    discountAmount: nextDiscountAmount,
                    totalAmount: nextTotalAmount,
                    notes: dto.notes ?? service.notes,
                    items: nextItems,
                });
                const saved = await transactionalServiceRepo.save(nextService);
                if (removedItemIds.length > 0) {
                    const removedItems = service.items.filter((item) => removedItemIds.includes(item.id));
                    await transactionalItemRepo.remove(removedItems);
                }
                return saved.id;
            });
            return this.findOne(savedId);
        };
        if (!useAutoFolio) {
            try {
                return await saveService(manualFolio ?? service.folio);
            }
            catch (error) {
                if (this.isUniqueConstraintError(error)) {
                    throw new common_1.ConflictException('Ya existe otro servicio con este folio.');
                }
                throw error;
            }
        }
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const nextFolio = await this.getNextAutoServiceFolio();
            try {
                return await saveService(nextFolio);
            }
            catch (error) {
                if (!this.isUniqueConstraintError(error)) {
                    throw error;
                }
            }
        }
        throw new common_1.ConflictException('No se pudo generar un folio automatico. Intenta de nuevo.');
    }
    async updateStatus(id, dto) {
        const service = await this.findOne(id);
        service.status = dto.status;
        service.completedAt =
            dto.status === service_order_entity_1.ServiceStatus.COMPLETED
                ? (service.completedAt ?? new Date())
                : undefined;
        return this.serviceRepo.save(service);
    }
    async softDelete(id) {
        const service = await this.findOne(id);
        service.isActive = false;
        service.deletedAt = new Date();
        await this.serviceRepo.save(service);
        return { message: 'Servicio desactivado correctamente.' };
    }
    async hardDelete(id) {
        this.runtimePolicy.assertHardDeleteAllowed('servicios');
        const service = await this.findOne(id);
        await this.serviceRepo.remove(service);
        return { message: 'Servicio eliminado definitivamente.' };
    }
    async generateReceiptPdf(id) {
        const service = await this.findOne(id);
        return this.buildReceiptPdfBuffer(service);
    }
    async generateTubeLabelsPdf(id) {
        const service = await this.findOne(id);
        return this.buildLabelsPdfBuffer(service);
    }
    async generateTicketPdf(id) {
        const service = await this.findOne(id);
        return this.buildTicketPdfBuffer(service);
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_order_entity_1.ServiceOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(service_order_entity_1.ServiceOrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(patient_entity_1.Patient)),
    __param(3, (0, typeorm_1.InjectRepository)(doctor_entity_1.Doctor)),
    __param(4, (0, typeorm_1.InjectRepository)(study_entity_1.Study)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        database_dialect_service_1.DatabaseDialectService,
        runtime_policy_service_1.RuntimePolicyService])
], ServicesService);
//# sourceMappingURL=services.service.js.map