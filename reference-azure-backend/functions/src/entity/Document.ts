import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Form } from "./Form";
import { Citation } from "./Citation";

@Entity({
    name: 'document',
    schema: 'dbo'
})
export class Document {
    @PrimaryGeneratedColumn()
    documentId!: number;

    @ManyToOne((type) => Form)
    @JoinColumn({ name: 'formId' })
    form: Form;

    @RelationId((document: Document) => document.form)
    @Column({ type: 'int', nullable: true})
    formId: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    name: string;

    @Column({ type: 'varchar', length: 255 })
    pdfUrl!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    diUrl: string;

    @Column({ type: 'varchar', length: 255 })
    creator!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    modifiedAt!: Date;

    @OneToMany(() => Citation, citation => citation.document)
    citations!: Citation[];

    @RelationId((document: Document) => document.citations)
    citationIds!: string[];
}
