import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Form } from "./Form";
import { Citation } from "./Citation";

@Entity({
    name: 'document',
    schema: 'dbo'
})
export class Document {
    @PrimaryGeneratedColumn()
    document_id!: number;

    @ManyToOne((type) => Form)
    @JoinColumn({ name: 'form_id' })
    form: Form;

    @RelationId((document: Document) => document.form)
    @Column({ type: 'int', nullable: true})
    form_id: number;

    @Column({ type: 'text', nullable: true })
    name: string;

    @Column('text')
    pdf_url!: string;

    @Column({ type: 'text', nullable: true })
    di_url: string;

    @Column('text')
    creator!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    modified_at!: Date;

    @OneToMany(() => Citation, citation => citation.document)
    citations!: Citation[];

    @RelationId((document: Document) => document.citations)
    citationIds!: string[];
}