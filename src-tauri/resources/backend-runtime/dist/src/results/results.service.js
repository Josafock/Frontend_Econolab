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
exports.ResultsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const PDFDocument = require("pdfkit");
const typeorm_2 = require("typeorm");
const fs = require("fs");
const QRCode = require("qrcode");
const person_util_1 = require("../common/utils/person.util");
const service_order_entity_1 = require("../services/entities/service-order.entity");
const study_detail_entity_1 = require("../studies/entities/study-detail.entity");
const study_result_entity_1 = require("./entities/study-result.entity");
const lab_config_1 = require("../config/lab.config");
const runtime_policy_service_1 = require("../runtime/runtime-policy.service");
const search_normalization_util_1 = require("../common/utils/search-normalization.util");
let ResultsService = class ResultsService {
    resultRepo;
    valueRepo;
    serviceRepo;
    itemRepo;
    detailRepo;
    configService;
    runtimePolicy;
    constructor(resultRepo, valueRepo, serviceRepo, itemRepo, detailRepo, configService, runtimePolicy) {
        this.resultRepo = resultRepo;
        this.valueRepo = valueRepo;
        this.serviceRepo = serviceRepo;
        this.itemRepo = itemRepo;
        this.detailRepo = detailRepo;
        this.configService = configService;
        this.runtimePolicy = runtimePolicy;
    }
    getLabRuntimeConfig() {
        return this.configService.getOrThrow('lab');
    }
    getLabResultsDocumentConfig() {
        const lab = this.getLabRuntimeConfig();
        return {
            name: lab.name,
            subtitle: lab.subtitle,
            address: lab.address || 'Direccion no configurada',
            addressLine2: lab.addressLine2,
            phone: lab.phone || 'Telefono no configurado',
            email: lab.email || 'Correo no configurado',
            schedule: lab.schedule || 'Horario no configurado',
            sampleSchedule: lab.sampleSchedule || 'Horario de toma no configurado',
            logoPath: lab.logoPath ?? '',
            signaturePath: lab.signaturePath ?? '',
            responsibleName: lab.responsibleName,
            responsibleLicense: lab.responsibleLicense,
        };
    }
    mapValueDtoToEntity(dto, studyDetail) {
        const baseLabel = studyDetail ? studyDetail.name : dto.label;
        const baseUnit = studyDetail ? studyDetail.unit : dto.unit;
        const baseRef = studyDetail
            ? studyDetail.referenceValue
            : dto.referenceValue;
        return this.valueRepo.create({
            publicId: dto.publicId ?? null,
            studyDetailId: dto.studyDetailId ?? studyDetail?.id,
            label: baseLabel,
            unit: baseUnit,
            referenceValue: baseRef,
            value: dto.value,
            sortOrder: dto.sortOrder,
            visible: dto.visible,
        });
    }
    async findStudyDetailById(studyDetailId) {
        if (!studyDetailId) {
            return undefined;
        }
        const detail = await this.detailRepo.findOne({
            where: { id: studyDetailId },
        });
        return detail ?? undefined;
    }
    async mapValueDtosToEntities(dtos) {
        const details = await Promise.all(dtos.map((dto) => this.findStudyDetailById(dto.studyDetailId)));
        return dtos.map((dto, index) => this.mapValueDtoToEntity(dto, details[index]));
    }
    getResultValueIdentityKey(value) {
        if (value.studyDetailId) {
            return `detail:${value.studyDetailId}`;
        }
        return `label:${(0, search_normalization_util_1.normalizeCompactSearchText)(value.label)}`;
    }
    reconcileResultValues(existingValues, preparedValues) {
        const existingByPublicId = new Map(existingValues
            .filter((value) => Boolean(value.publicId))
            .map((value) => [value.publicId, value]));
        const existingBuckets = new Map();
        const usedValueIds = new Set();
        for (const value of [...existingValues].sort((a, b) => a.id - b.id)) {
            const key = this.getResultValueIdentityKey(value);
            const bucket = existingBuckets.get(key) ?? [];
            bucket.push(value);
            existingBuckets.set(key, bucket);
        }
        const takeNextBucketMatch = (preparedValue) => {
            const key = this.getResultValueIdentityKey(preparedValue);
            const bucket = existingBuckets.get(key) ?? [];
            while (bucket.length > 0) {
                const candidate = bucket.shift();
                if (!usedValueIds.has(candidate.id)) {
                    return candidate;
                }
            }
            return undefined;
        };
        const values = preparedValues.map((preparedValue) => {
            let matched = (preparedValue.publicId
                ? existingByPublicId.get(preparedValue.publicId)
                : undefined) ?? takeNextBucketMatch(preparedValue);
            if (matched && usedValueIds.has(matched.id)) {
                matched = takeNextBucketMatch(preparedValue);
            }
            if (!matched) {
                return preparedValue;
            }
            usedValueIds.add(matched.id);
            return this.valueRepo.merge(matched, {
                ...preparedValue,
                publicId: matched.publicId ?? preparedValue.publicId ?? null,
                deletedAt: null,
            });
        });
        const removedValueIds = existingValues
            .filter((value) => !usedValueIds.has(value.id))
            .map((value) => value.id);
        return { values, removedValueIds };
    }
    findActiveResultByServiceItem(serviceOrderItemId) {
        return this.resultRepo.findOne({
            where: { serviceOrderItemId, isActive: true },
        });
    }
    async buildQrBuffer(result) {
        const finalUrl = (0, lab_config_1.buildLabResultUrl)(this.getLabRuntimeConfig(), result.id);
        if (!finalUrl)
            return null;
        try {
            return await QRCode.toBuffer(finalUrl, {
                type: 'png',
                width: 140,
                margin: 1,
            });
        }
        catch {
            return null;
        }
    }
    formatDocumentDate(value) {
        if (!value)
            return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime()))
            return '';
        const pad = (segment) => String(segment).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
    formatGenderLabel(gender) {
        switch (gender) {
            case 'male':
                return 'Masculino';
            case 'female':
                return 'Femenino';
            case 'other':
                return 'Otro';
            default:
                return 'N/D';
        }
    }
    displayText(value) {
        return value?.trim() || 'N/D';
    }
    formatBirthDateLabel(value) {
        if (!value)
            return 'N/D';
        try {
            return new Date(`${value}T00:00:00`).toLocaleDateString('es-MX');
        }
        catch {
            return value;
        }
    }
    normalizePdfOptions(rawOptions) {
        const read = (value) => (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase();
        const signature = read(rawOptions?.signature);
        const categoryLayout = read(rawOptions?.categoryLayout);
        const studyLayout = read(rawOptions?.studyLayout);
        return {
            includeSignature: !['without', 'false', '0', 'sin'].includes(signature ?? ''),
            categoryLayout: categoryLayout === 'page-per-category'
                ? 'page-per-category'
                : 'continuous',
            studyLayout: studyLayout === 'page-per-study' ? 'page-per-study' : 'continuous',
        };
    }
    groupResultValues(values, studyDetails) {
        const visibleValues = (values ?? [])
            .filter((value) => value.visible !== false)
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder);
        if (visibleValues.length === 0) {
            return [];
        }
        const detailById = new Map(studyDetails.map((detail) => [detail.id, detail]));
        const groupedValueIds = new Set();
        const groups = [];
        const categories = studyDetails
            .filter((detail) => detail.dataType === study_detail_entity_1.StudyDetailType.CATEGORY &&
            detail.isActive !== false)
            .sort((a, b) => a.sortOrder - b.sortOrder);
        for (const category of categories) {
            const rows = visibleValues.filter((value) => {
                const detail = detailById.get(value.studyDetailId ?? -1);
                return detail?.parentId === category.id;
            });
            if (rows.length === 0) {
                continue;
            }
            rows.forEach((row) => groupedValueIds.add(row.id));
            groups.push({
                title: category.name,
                rows,
            });
        }
        const uncategorizedRows = visibleValues.filter((value) => !groupedValueIds.has(value.id));
        if (uncategorizedRows.length > 0 || groups.length === 0) {
            groups.push({
                title: uncategorizedRows.length > 0 && groups.length > 0
                    ? 'Sin categoria'
                    : undefined,
                rows: uncategorizedRows.length > 0 ? uncategorizedRows : visibleValues,
            });
        }
        return groups;
    }
    drawResultTableHeader(doc, left, right, y, columns) {
        doc
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('Parametro', columns.label, y, { width: 210 })
            .text('Resultado', columns.value, y, { width: 90 })
            .text('Unidad', columns.unit, y, { width: 70 })
            .text('Referencia', columns.ref, y, { width: 87 });
        doc
            .moveTo(left, y + 18)
            .lineTo(right, y + 18)
            .strokeColor('#cfcfcf')
            .stroke();
        return y + 28;
    }
    drawResultGroupTitle(doc, left, right, y, title) {
        if (!title) {
            return y;
        }
        doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .fillColor('#356e93')
            .text(title, left, y, {
            width: right - left,
        })
            .fillColor('black');
        return y + 18;
    }
    async getStudyDetailsMap(studyIds) {
        const uniqueStudyIds = [...new Set(studyIds)];
        const entries = await Promise.all(uniqueStudyIds.map(async (studyId) => {
            const details = await this.detailRepo.find({
                where: { studyId, isActive: true },
                order: { sortOrder: 'ASC' },
            });
            return [studyId, details];
        }));
        return new Map(entries);
    }
    async buildPdfBufferWithOptions(result, studyDetails, options) {
        const qrBuffer = await this.buildQrBuffer(result);
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 48, size: 'LETTER' });
            const chunks = [];
            const drawImageIfValid = (imagePath, x, y, drawOptions) => {
                if (!imagePath || !fs.existsSync(imagePath)) {
                    return false;
                }
                try {
                    doc.image(imagePath, x, y, drawOptions);
                    return true;
                }
                catch {
                    return false;
                }
            };
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('error', (err) => reject(err instanceof Error
                ? err
                : new Error('No se pudo generar el PDF del resultado.')));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            const lab = this.getLabResultsDocumentConfig();
            const labName = lab.name;
            const labSubtitle = lab.subtitle;
            const labAddress = lab.address;
            const labAddress2 = lab.addressLine2;
            const labPhone = lab.phone;
            const labEmail = lab.email;
            const labSchedule = lab.schedule;
            const labSampleSchedule = lab.sampleSchedule;
            const logoPath = lab.logoPath;
            const signaturePath = lab.signaturePath;
            const responsibleName = lab.responsibleName;
            const responsibleLicense = lab.responsibleLicense;
            const service = result.serviceOrder;
            const patient = service?.patient;
            const doctor = service?.doctor;
            const studyName = result.serviceOrderItem?.studyNameSnapshot ?? '';
            const groups = this.groupResultValues(result.values ?? [], studyDetails);
            const left = 48;
            const right = doc.page.width - left;
            const pageBottom = doc.page.height - 48;
            const headerY = 48;
            const logoBox = { x: left, y: headerY, w: 90, h: 50 };
            const columns = {
                label: left,
                value: 280,
                unit: 380,
                ref: 460,
            };
            const signatureWidth = 187;
            const signatureX = right - signatureWidth;
            const footerBlockHeight = options.includeSignature ? 150 : 110;
            const patientName = (0, person_util_1.buildPersonName)(patient?.firstName, patient?.lastName, patient?.middleName);
            const doctorName = (0, person_util_1.buildPersonName)(doctor?.firstName, doctor?.lastName, doctor?.middleName);
            const doctorDisplayName = doctorName || 'A QUIEN CORRESPONDA';
            const patientBirthDate = this.formatBirthDateLabel(patient?.birthDate);
            const patientAge = this.displayText((0, person_util_1.formatAgeLabel)(patient?.birthDate, ''));
            const patientGender = this.displayText(this.formatGenderLabel(patient?.gender));
            const patientPhone = this.displayText(patient?.phone);
            const patientAddress = this.displayText(patient?.addressLine);
            const patientBetween = this.displayText(patient?.addressBetween);
            const doctorLicense = this.displayText(doctor?.licenseNumber);
            const doctorSpecialty = this.displayText(doctor?.specialty);
            const sampleDate = this.displayText(this.formatDocumentDate(result.sampleAt ?? service?.sampleAt));
            const deliveryDate = this.displayText(this.formatDocumentDate(result.reportedAt));
            const resetTableOnNewPage = (groupTitle) => {
                doc.addPage();
                let nextY = this.drawResultTableHeader(doc, left, right, 70, columns);
                nextY = this.drawResultGroupTitle(doc, left, right, nextY, groupTitle);
                doc.font('Helvetica').fontSize(10);
                return nextY;
            };
            const hasLogo = drawImageIfValid(logoPath, logoBox.x, logoBox.y, {
                fit: [logoBox.w, logoBox.h],
            });
            if (!hasLogo) {
                doc
                    .rect(logoBox.x, logoBox.y, logoBox.w, logoBox.h)
                    .strokeColor('#cccccc')
                    .stroke();
                doc
                    .font('Helvetica')
                    .fontSize(8)
                    .fillColor('#666666')
                    .text('LOGO', logoBox.x, logoBox.y + 18, {
                    width: logoBox.w,
                    align: 'center',
                })
                    .fillColor('black');
            }
            doc
                .font('Helvetica-Bold')
                .fontSize(18)
                .text(labName, 160, headerY - 2, { width: 220, align: 'center' });
            doc
                .font('Helvetica')
                .fontSize(9)
                .text(labSubtitle, 160, headerY + 22, { width: 220, align: 'center' });
            doc.text(labAddress, 160, headerY + 34, { width: 220, align: 'center' });
            if (labAddress2) {
                doc.text(labAddress2, 160, headerY + 46, {
                    width: 220,
                    align: 'center',
                });
            }
            doc
                .font('Helvetica-Bold')
                .fontSize(12)
                .text(`SUC: ${this.displayText(service?.branchName)}`, 390, headerY, {
                width: right - 390,
                align: 'right',
            });
            doc.text(`FOLIO: ${this.displayText(service?.folio)}`, 390, headerY + 20, {
                width: right - 390,
                align: 'right',
            });
            doc.moveTo(left, 126).lineTo(right, 126).strokeColor('#bdbdbd').stroke();
            const infoTop = 140;
            doc.font('Helvetica-Bold').fontSize(11).text('PACIENTE', left, infoTop);
            doc.font('Helvetica').fontSize(9.5);
            doc.text(`Nombre: ${this.displayText(patientName)}`, left, infoTop + 22, {
                width: 230,
            });
            doc.text(`Fecha nac.: ${patientBirthDate}`, left, infoTop + 38, {
                width: 230,
            });
            doc.text(`Edad: ${patientAge}`, left, infoTop + 54, { width: 230 });
            doc.text(`Tel: ${patientPhone}`, left, infoTop + 70, { width: 230 });
            doc.text(`Sexo: ${patientGender}`, left, infoTop + 86, { width: 230 });
            doc.text(`Direccion: ${patientAddress}`, left, infoTop + 102, {
                width: 230,
            });
            doc.text(`Entre calles: ${patientBetween}`, left, infoTop + 118, {
                width: 230,
            });
            const doctorX = 300;
            doc.font('Helvetica-Bold').fontSize(11).text('MEDICO', doctorX, infoTop);
            doc.font('Helvetica').fontSize(9.5);
            doc.text(`Doctor(a): ${doctorDisplayName}`, doctorX, infoTop + 22, {
                width: 247,
            });
            doc.text(`Cedula: ${doctorLicense}`, doctorX, infoTop + 38, {
                width: 247,
            });
            doc.text(`Especialidad: ${doctorSpecialty}`, doctorX, infoTop + 54, {
                width: 247,
            });
            doc.text(`Fecha de toma de muestra: ${sampleDate}`, doctorX, infoTop + 70, {
                width: 247,
            });
            doc.text(`Fecha de entrega de resultado: ${deliveryDate}`, doctorX, infoTop + 86, { width: 247 });
            doc.moveTo(left, 272).lineTo(right, 272).strokeColor('#bdbdbd').stroke();
            doc
                .font('Helvetica-Bold')
                .fontSize(13)
                .fillColor('#356e93')
                .text(`ESTUDIO: ${studyName}`, left, 282, {
                width: right - left,
                align: 'center',
            })
                .fillColor('black');
            if (result.method) {
                doc
                    .font('Helvetica')
                    .fontSize(9)
                    .text(`Metodo: ${result.method}`, left, 298, {
                    width: right - left,
                    align: 'center',
                });
            }
            const tableY = result.method ? 318 : 306;
            let cursorY = this.drawResultTableHeader(doc, left, right, tableY, columns);
            doc.font('Helvetica').fontSize(10);
            if (groups.length === 0) {
                doc.text('Sin parametros visibles para mostrar.', left, cursorY, {
                    width: right - left,
                });
                cursorY += 24;
            }
            else {
                for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
                    const group = groups[groupIndex];
                    if (options.categoryLayout === 'page-per-category' &&
                        groupIndex > 0) {
                        cursorY = resetTableOnNewPage();
                    }
                    else if (cursorY > pageBottom - 160) {
                        cursorY = resetTableOnNewPage();
                    }
                    cursorY = this.drawResultGroupTitle(doc, left, right, cursorY, group.title);
                    doc.font('Helvetica').fontSize(10);
                    for (const value of group.rows) {
                        if (cursorY > pageBottom - 140) {
                            cursorY = resetTableOnNewPage(group.title);
                        }
                        doc.text(value.label ?? '', columns.label, cursorY, { width: 210 });
                        doc.text(value.value ?? '', columns.value, cursorY, { width: 90 });
                        doc.text(value.unit ?? '', columns.unit, cursorY, { width: 70 });
                        doc.text(value.referenceValue ?? '', columns.ref, cursorY, {
                            width: 87,
                        });
                        cursorY += 18;
                    }
                    cursorY += 10;
                }
            }
            let footerY = Math.max(cursorY + 20, pageBottom - footerBlockHeight);
            if (footerY + footerBlockHeight > pageBottom) {
                doc.addPage();
                footerY = doc.page.height - 48 - footerBlockHeight;
            }
            doc
                .moveTo(left, footerY - 10)
                .lineTo(right, footerY - 10)
                .strokeColor('#bdbdbd')
                .stroke();
            if (qrBuffer) {
                doc.image(qrBuffer, left, footerY + 6, { width: 72, height: 72 });
            }
            else {
                doc
                    .rect(left, footerY + 6, 72, 72)
                    .strokeColor('#cccccc')
                    .stroke();
                doc
                    .font('Helvetica')
                    .fontSize(7)
                    .fillColor('#666666')
                    .text('QR', left, footerY + 36, { width: 72, align: 'center' })
                    .fillColor('black');
            }
            doc
                .font('Helvetica')
                .fontSize(7)
                .text('ESCANEA QR PARA', left, footerY + 80, {
                width: 72,
                align: 'center',
            });
            doc.text('VALIDAR RESULTADOS', left, footerY + 88, {
                width: 72,
                align: 'center',
            });
            doc
                .font('Helvetica')
                .fontSize(9)
                .text(labSchedule, 132, footerY + 12)
                .text(labSampleSchedule, 132, footerY + 28)
                .text(`Correo: ${labEmail}`, 132, footerY + 44)
                .text(`Telefono: ${labPhone}`, 132, footerY + 60);
            if (options.includeSignature) {
                doc
                    .font('Helvetica')
                    .fontSize(13)
                    .text('ATENTAMENTE', signatureX, footerY + 18, {
                    width: signatureWidth,
                    align: 'right',
                });
                drawImageIfValid(signaturePath, signatureX, footerY + 30, {
                    fit: [160, 54],
                    align: 'right',
                });
                doc
                    .moveTo(signatureX, footerY + 84)
                    .lineTo(right, footerY + 84)
                    .strokeColor('#202020')
                    .stroke();
                doc
                    .font('Helvetica')
                    .fontSize(11)
                    .text(responsibleName, signatureX, footerY + 90, {
                    width: signatureWidth,
                    align: 'right',
                });
                if (responsibleLicense) {
                    doc.text(`Ced. Prof. ${responsibleLicense}`, signatureX, footerY + 106, {
                        width: signatureWidth,
                        align: 'right',
                    });
                }
                doc
                    .font('Helvetica')
                    .fontSize(8)
                    .text('Este resultado es confidencial y forma parte del expediente clinico.', signatureX, footerY + 130, {
                    width: signatureWidth,
                    align: 'left',
                });
            }
            else {
                doc
                    .font('Helvetica')
                    .fontSize(9)
                    .text('Documento emitido sin firma.', signatureX, footerY + 18, {
                    width: signatureWidth,
                    align: 'right',
                });
                doc
                    .font('Helvetica')
                    .fontSize(8)
                    .text('Este resultado es confidencial y forma parte del expediente clinico.', signatureX, footerY + 42, {
                    width: signatureWidth,
                    align: 'left',
                });
            }
            doc.end();
        });
    }
    async buildServicePdfBufferWithOptions(service, sections, options) {
        const qrBuffer = sections[0]
            ? await this.buildQrBuffer(sections[0].result)
            : null;
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 48, size: 'LETTER' });
            const chunks = [];
            const drawImageIfValid = (imagePath, x, y, drawOptions) => {
                if (!imagePath || !fs.existsSync(imagePath)) {
                    return false;
                }
                try {
                    doc.image(imagePath, x, y, drawOptions);
                    return true;
                }
                catch {
                    return false;
                }
            };
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('error', (err) => reject(err instanceof Error
                ? err
                : new Error('No se pudo generar el PDF del servicio.')));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            const lab = this.getLabResultsDocumentConfig();
            const labName = lab.name;
            const labSubtitle = lab.subtitle;
            const labAddress = lab.address;
            const labAddress2 = lab.addressLine2;
            const labPhone = lab.phone;
            const labEmail = lab.email;
            const labSchedule = lab.schedule;
            const labSampleSchedule = lab.sampleSchedule;
            const logoPath = lab.logoPath;
            const signaturePath = lab.signaturePath;
            const responsibleName = lab.responsibleName;
            const responsibleLicense = lab.responsibleLicense;
            const patient = service.patient;
            const doctor = service.doctor;
            const left = 48;
            const right = doc.page.width - left;
            const pageBottom = doc.page.height - 48;
            const headerY = 48;
            const logoBox = { x: left, y: headerY, w: 90, h: 50 };
            const columns = {
                label: left,
                value: 280,
                unit: 380,
                ref: 460,
            };
            const signatureWidth = 187;
            const signatureX = right - signatureWidth;
            const footerBlockHeight = options.includeSignature ? 150 : 110;
            const combinedStudyTitle = options.studyLayout === 'page-per-study'
                ? 'RESULTADOS DE ESTUDIOS'
                : sections
                    .map((section) => section.studyName)
                    .filter((name) => Boolean(name?.trim()))
                    .join(', ') || 'RESULTADOS';
            const patientName = (0, person_util_1.buildPersonName)(patient?.firstName, patient?.lastName, patient?.middleName);
            const doctorName = (0, person_util_1.buildPersonName)(doctor?.firstName, doctor?.lastName, doctor?.middleName);
            const doctorDisplayName = doctorName || 'A QUIEN CORRESPONDA';
            const patientBirthDate = this.formatBirthDateLabel(patient?.birthDate);
            const patientAge = this.displayText((0, person_util_1.formatAgeLabel)(patient?.birthDate, ''));
            const patientGender = this.displayText(this.formatGenderLabel(patient?.gender));
            const patientPhone = this.displayText(patient?.phone);
            const patientAddress = this.displayText(patient?.addressLine);
            const patientBetween = this.displayText(patient?.addressBetween);
            const doctorLicense = this.displayText(doctor?.licenseNumber);
            const doctorSpecialty = this.displayText(doctor?.specialty);
            const sampleDate = this.displayText(this.formatDocumentDate(service.sampleAt));
            const deliveryDate = this.displayText(this.formatDocumentDate(service.deliveryAt));
            const sectionLabel = (section) => section.packageName
                ? `${section.packageName} / ${section.studyName}`
                : section.studyName;
            const drawSectionHeader = (section, y) => {
                const showSectionTitle = sections.length > 1 ||
                    Boolean(section.packageName) ||
                    options.studyLayout === 'page-per-study';
                let nextY = y;
                if (showSectionTitle) {
                    doc
                        .font('Helvetica-Bold')
                        .fontSize(12)
                        .text(sectionLabel(section), left, nextY, {
                        width: right - left,
                        align: 'center',
                    });
                    nextY += 18;
                }
                if (section.result.method) {
                    doc
                        .font('Helvetica')
                        .fontSize(9)
                        .text(`Metodo: ${section.result.method}`, left, nextY, {
                        width: right - left,
                        align: 'center',
                    });
                    nextY += 16;
                }
                nextY = this.drawResultTableHeader(doc, left, right, nextY, columns);
                doc.font('Helvetica').fontSize(10);
                return nextY;
            };
            const resetSectionOnNewPage = (section, groupTitle) => {
                doc.addPage();
                let nextY = drawSectionHeader(section, 70);
                nextY = this.drawResultGroupTitle(doc, left, right, nextY, groupTitle);
                doc.font('Helvetica').fontSize(10);
                return nextY;
            };
            const hasLogo = drawImageIfValid(logoPath, logoBox.x, logoBox.y, {
                fit: [logoBox.w, logoBox.h],
            });
            if (!hasLogo) {
                doc
                    .rect(logoBox.x, logoBox.y, logoBox.w, logoBox.h)
                    .strokeColor('#cccccc')
                    .stroke();
                doc
                    .font('Helvetica')
                    .fontSize(8)
                    .fillColor('#666666')
                    .text('LOGO', logoBox.x, logoBox.y + 18, {
                    width: logoBox.w,
                    align: 'center',
                })
                    .fillColor('black');
            }
            doc
                .font('Helvetica-Bold')
                .fontSize(18)
                .text(labName, 160, headerY - 2, { width: 220, align: 'center' });
            doc
                .font('Helvetica')
                .fontSize(9)
                .text(labSubtitle, 160, headerY + 22, { width: 220, align: 'center' });
            doc.text(labAddress, 160, headerY + 34, { width: 220, align: 'center' });
            if (labAddress2) {
                doc.text(labAddress2, 160, headerY + 46, {
                    width: 220,
                    align: 'center',
                });
            }
            doc
                .font('Helvetica-Bold')
                .fontSize(12)
                .text(`SUC: ${this.displayText(service.branchName)}`, 390, headerY, {
                width: right - 390,
                align: 'right',
            });
            doc.text(`FOLIO: ${this.displayText(service.folio)}`, 390, headerY + 20, {
                width: right - 390,
                align: 'right',
            });
            doc.moveTo(left, 126).lineTo(right, 126).strokeColor('#bdbdbd').stroke();
            const infoTop = 140;
            doc.font('Helvetica-Bold').fontSize(11).text('PACIENTE', left, infoTop);
            doc.font('Helvetica').fontSize(9.5);
            doc.text(`Nombre: ${this.displayText(patientName)}`, left, infoTop + 22, {
                width: 230,
            });
            doc.text(`Fecha nac.: ${patientBirthDate}`, left, infoTop + 38, {
                width: 230,
            });
            doc.text(`Edad: ${patientAge}`, left, infoTop + 54, { width: 230 });
            doc.text(`Tel: ${patientPhone}`, left, infoTop + 70, { width: 230 });
            doc.text(`Sexo: ${patientGender}`, left, infoTop + 86, { width: 230 });
            doc.text(`Direccion: ${patientAddress}`, left, infoTop + 102, {
                width: 230,
            });
            doc.text(`Entre calles: ${patientBetween}`, left, infoTop + 118, {
                width: 230,
            });
            const doctorX = 300;
            doc.font('Helvetica-Bold').fontSize(11).text('MEDICO', doctorX, infoTop);
            doc.font('Helvetica').fontSize(9.5);
            doc.text(`Doctor(a): ${doctorDisplayName}`, doctorX, infoTop + 22, {
                width: 247,
            });
            doc.text(`Cedula: ${doctorLicense}`, doctorX, infoTop + 38, {
                width: 247,
            });
            doc.text(`Especialidad: ${doctorSpecialty}`, doctorX, infoTop + 54, {
                width: 247,
            });
            doc.text(`Fecha de toma de muestra: ${sampleDate}`, doctorX, infoTop + 70, {
                width: 247,
            });
            doc.text(`Fecha de entrega de resultado: ${deliveryDate}`, doctorX, infoTop + 86, { width: 247 });
            doc.moveTo(left, 272).lineTo(right, 272).strokeColor('#bdbdbd').stroke();
            doc
                .font('Helvetica-Bold')
                .fontSize(12.5)
                .fillColor('#356e93')
                .text(combinedStudyTitle, left, 284, {
                width: right - left,
                align: 'center',
            })
                .fillColor('black');
            doc.moveTo(left, 304).lineTo(right, 304).strokeColor('#bdbdbd').stroke();
            let cursorY = 320;
            for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
                const section = sections[sectionIndex];
                const groups = this.groupResultValues(section.result.values ?? [], section.studyDetails);
                if (sectionIndex > 0 && options.studyLayout === 'page-per-study') {
                    doc.addPage();
                    cursorY = 70;
                }
                else if (cursorY > pageBottom - 180) {
                    doc.addPage();
                    cursorY = 70;
                }
                cursorY = drawSectionHeader(section, cursorY);
                if (groups.length === 0) {
                    doc.text('Sin parametros visibles para mostrar.', left, cursorY, {
                        width: right - left,
                    });
                    cursorY += 28;
                }
                else {
                    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
                        const group = groups[groupIndex];
                        if (options.categoryLayout === 'page-per-category' &&
                            groupIndex > 0) {
                            cursorY = resetSectionOnNewPage(section);
                        }
                        else if (cursorY > pageBottom - 160) {
                            cursorY = resetSectionOnNewPage(section);
                        }
                        cursorY = this.drawResultGroupTitle(doc, left, right, cursorY, group.title);
                        doc.font('Helvetica').fontSize(10);
                        for (const value of group.rows) {
                            if (cursorY > pageBottom - 140) {
                                cursorY = resetSectionOnNewPage(section, group.title);
                            }
                            doc.text(value.label ?? '', columns.label, cursorY, {
                                width: 210,
                            });
                            doc.text(value.value ?? '', columns.value, cursorY, {
                                width: 90,
                            });
                            doc.text(value.unit ?? '', columns.unit, cursorY, { width: 70 });
                            doc.text(value.referenceValue ?? '', columns.ref, cursorY, {
                                width: 87,
                            });
                            cursorY += 18;
                        }
                        cursorY += 10;
                    }
                }
                cursorY += 12;
            }
            let footerY = Math.max(cursorY + 10, pageBottom - footerBlockHeight);
            if (footerY + footerBlockHeight > pageBottom) {
                doc.addPage();
                footerY = doc.page.height - 48 - footerBlockHeight;
            }
            doc
                .moveTo(left, footerY - 10)
                .lineTo(right, footerY - 10)
                .strokeColor('#bdbdbd')
                .stroke();
            if (qrBuffer) {
                doc.image(qrBuffer, left, footerY + 6, { width: 72, height: 72 });
            }
            else {
                doc
                    .rect(left, footerY + 6, 72, 72)
                    .strokeColor('#cccccc')
                    .stroke();
                doc
                    .font('Helvetica')
                    .fontSize(7)
                    .fillColor('#666666')
                    .text('QR', left, footerY + 36, { width: 72, align: 'center' })
                    .fillColor('black');
            }
            doc
                .font('Helvetica')
                .fontSize(7)
                .text('ESCANEA QR PARA', left, footerY + 80, {
                width: 72,
                align: 'center',
            });
            doc.text('VALIDAR RESULTADOS', left, footerY + 88, {
                width: 72,
                align: 'center',
            });
            doc
                .font('Helvetica')
                .fontSize(9)
                .text(labSchedule, 132, footerY + 12)
                .text(labSampleSchedule, 132, footerY + 28)
                .text(`Correo: ${labEmail}`, 132, footerY + 44)
                .text(`Telefono: ${labPhone}`, 132, footerY + 60);
            if (options.includeSignature) {
                doc
                    .font('Helvetica')
                    .fontSize(13)
                    .text('ATENTAMENTE', signatureX, footerY + 18, {
                    width: signatureWidth,
                    align: 'right',
                });
                drawImageIfValid(signaturePath, signatureX, footerY + 30, {
                    fit: [160, 54],
                    align: 'right',
                });
                doc
                    .moveTo(signatureX, footerY + 84)
                    .lineTo(right, footerY + 84)
                    .strokeColor('#202020')
                    .stroke();
                doc
                    .font('Helvetica')
                    .fontSize(11)
                    .text(responsibleName, signatureX, footerY + 90, {
                    width: signatureWidth,
                    align: 'right',
                });
                if (responsibleLicense) {
                    doc.text(`Ced. Prof. ${responsibleLicense}`, signatureX, footerY + 106, {
                        width: signatureWidth,
                        align: 'right',
                    });
                }
                doc
                    .font('Helvetica')
                    .fontSize(8)
                    .text('Este resultado es confidencial y forma parte del expediente clinico.', signatureX, footerY + 130, {
                    width: signatureWidth,
                    align: 'left',
                });
            }
            else {
                doc
                    .font('Helvetica')
                    .fontSize(9)
                    .text('Documento emitido sin firma.', signatureX, footerY + 18, {
                    width: signatureWidth,
                    align: 'right',
                });
                doc
                    .font('Helvetica')
                    .fontSize(8)
                    .text('Este resultado es confidencial y forma parte del expediente clinico.', signatureX, footerY + 42, {
                    width: signatureWidth,
                    align: 'left',
                });
            }
            doc.end();
        });
    }
    async getOrCreateDraftByServiceItem(serviceOrderItemId) {
        const existing = await this.findActiveResultByServiceItem(serviceOrderItemId);
        if (existing) {
            return existing;
        }
        const item = await this.itemRepo.findOne({
            where: { id: serviceOrderItemId },
            relations: ['serviceOrder'],
        });
        if (!item || !item.serviceOrder || !item.serviceOrder.isActive) {
            throw new common_1.NotFoundException('No se encontró el estudio dentro del servicio.');
        }
        const details = await this.detailRepo.find({
            where: { studyId: item.studyId, isActive: true },
            order: { sortOrder: 'ASC' },
        });
        const activeCategoryIds = new Set(details
            .filter((detail) => detail.dataType === study_detail_entity_1.StudyDetailType.CATEGORY)
            .map((detail) => detail.id));
        const parameters = details.filter((detail) => detail.dataType === study_detail_entity_1.StudyDetailType.PARAMETER &&
            (!detail.parentId || activeCategoryIds.has(detail.parentId)));
        const values = parameters.map((d) => this.valueRepo.create({
            studyDetailId: d.id,
            label: d.name,
            unit: d.unit,
            referenceValue: d.referenceValue,
            sortOrder: d.sortOrder,
            visible: true,
        }));
        const draft = this.resultRepo.create({
            serviceOrderId: item.serviceOrderId,
            serviceOrderItemId,
            sampleAt: item.serviceOrder.sampleAt,
            isDraft: true,
            isActive: true,
            values,
        });
        return this.resultRepo.save(draft);
    }
    async findOne(id) {
        const result = await this.resultRepo.findOne({
            where: { id, isActive: true },
        });
        if (!result) {
            throw new common_1.NotFoundException('Resultado de estudio no encontrado.');
        }
        return result;
    }
    async generatePdf(id, rawOptions) {
        const result = await this.resultRepo.findOne({
            where: { id, isActive: true },
            relations: {
                serviceOrder: { patient: true, doctor: true, items: true },
                serviceOrderItem: true,
                values: true,
            },
        });
        if (!result) {
            throw new common_1.NotFoundException('Resultado de estudio no encontrado.');
        }
        const studyDetails = await this.detailRepo.find({
            where: {
                studyId: result.serviceOrderItem.studyId,
                isActive: true,
            },
            order: { sortOrder: 'ASC' },
        });
        const options = this.normalizePdfOptions(rawOptions);
        return this.buildPdfBufferWithOptions(result, studyDetails, options);
    }
    async generateServicePdf(serviceOrderId, rawOptions) {
        const service = await this.serviceRepo.findOne({
            where: { id: serviceOrderId, isActive: true },
            relations: {
                patient: true,
                doctor: true,
                items: true,
            },
        });
        if (!service) {
            throw new common_1.NotFoundException('Servicio no encontrado.');
        }
        const orderedItems = [...(service.items ?? [])].sort((a, b) => a.id - b.id);
        if (orderedItems.length === 0) {
            throw new common_1.NotFoundException('Este servicio no tiene estudios asociados para generar resultados.');
        }
        const detailMap = await this.getStudyDetailsMap(orderedItems.map((item) => item.studyId));
        const options = this.normalizePdfOptions(rawOptions);
        const sections = [];
        for (const item of orderedItems) {
            const result = await this.getOrCreateDraftByServiceItem(item.id);
            sections.push({
                result,
                studyName: item.studyNameSnapshot,
                packageName: item.sourcePackageNameSnapshot,
                studyDetails: detailMap.get(item.studyId) ?? [],
            });
        }
        return this.buildServicePdfBufferWithOptions(service, sections, options);
    }
    async create(dto) {
        const service = await this.serviceRepo.findOne({
            where: { id: dto.serviceOrderId, isActive: true },
        });
        if (!service) {
            throw new common_1.NotFoundException('El servicio clínico no existe o está inactivo.');
        }
        const item = await this.itemRepo.findOne({
            where: {
                id: dto.serviceOrderItemId,
                serviceOrderId: dto.serviceOrderId,
            },
        });
        if (!item) {
            throw new common_1.NotFoundException('El estudio indicado no pertenece a este servicio.');
        }
        const existing = await this.findActiveResultByServiceItem(dto.serviceOrderItemId);
        if (existing) {
            throw new common_1.BadRequestException('Ya existen resultados registrados para este estudio. Utiliza la edición.');
        }
        const values = await this.mapValueDtosToEntities(dto.values);
        const entity = this.resultRepo.create({
            serviceOrderId: dto.serviceOrderId,
            serviceOrderItemId: dto.serviceOrderItemId,
            sampleAt: dto.sampleAt ? new Date(dto.sampleAt) : service.sampleAt,
            reportedAt: dto.reportedAt ? new Date(dto.reportedAt) : undefined,
            method: dto.method,
            observations: dto.observations,
            isDraft: dto.isDraft ?? true,
            isActive: true,
            values,
        });
        return this.resultRepo.save(entity);
    }
    async update(id, dto) {
        const result = await this.findOne(id);
        let removedValueIds = [];
        if (dto.serviceOrderId && dto.serviceOrderId !== result.serviceOrderId) {
            throw new common_1.BadRequestException('No se puede cambiar el servicio clínico de un resultado.');
        }
        if (dto.serviceOrderItemId &&
            dto.serviceOrderItemId !== result.serviceOrderItemId) {
            throw new common_1.BadRequestException('No se puede cambiar el estudio asociado al resultado.');
        }
        if (dto.values && dto.values.length > 0) {
            const preparedValues = await this.mapValueDtosToEntities(dto.values);
            const reconciliation = this.reconcileResultValues(result.values ?? [], preparedValues);
            result.values = reconciliation.values;
            removedValueIds = reconciliation.removedValueIds;
        }
        if (dto.sampleAt) {
            result.sampleAt = new Date(dto.sampleAt);
        }
        if (dto.reportedAt) {
            result.reportedAt = new Date(dto.reportedAt);
        }
        if (dto.method !== undefined) {
            result.method = dto.method;
        }
        if (dto.observations !== undefined) {
            result.observations = dto.observations;
        }
        if (dto.isDraft !== undefined) {
            result.isDraft = dto.isDraft;
        }
        const savedId = await this.resultRepo.manager.transaction(async (manager) => {
            const transactionalResultRepo = manager.getRepository(study_result_entity_1.StudyResult);
            const transactionalValueRepo = manager.getRepository(study_result_entity_1.StudyResultValue);
            const saved = await transactionalResultRepo.save(result);
            if (removedValueIds.length > 0) {
                const removedValues = result.values.filter((value) => removedValueIds.includes(value.id));
                await transactionalValueRepo.remove(removedValues);
            }
            return saved.id;
        });
        return this.findOne(savedId);
    }
    async softDelete(id) {
        const result = await this.findOne(id);
        result.isActive = false;
        result.deletedAt = new Date();
        await this.resultRepo.save(result);
        return { message: 'Resultado desactivado correctamente.' };
    }
    async hardDelete(id) {
        this.runtimePolicy.assertHardDeleteAllowed('resultados');
        const result = await this.findOne(id);
        await this.resultRepo.remove(result);
        return { message: 'Resultado eliminado definitivamente.' };
    }
};
exports.ResultsService = ResultsService;
exports.ResultsService = ResultsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(study_result_entity_1.StudyResult)),
    __param(1, (0, typeorm_1.InjectRepository)(study_result_entity_1.StudyResultValue)),
    __param(2, (0, typeorm_1.InjectRepository)(service_order_entity_1.ServiceOrder)),
    __param(3, (0, typeorm_1.InjectRepository)(service_order_entity_1.ServiceOrderItem)),
    __param(4, (0, typeorm_1.InjectRepository)(study_detail_entity_1.StudyDetail)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        runtime_policy_service_1.RuntimePolicyService])
], ResultsService);
//# sourceMappingURL=results.service.js.map