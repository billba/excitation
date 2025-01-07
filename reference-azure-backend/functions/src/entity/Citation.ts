import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Form } from "./Form";
import { Question } from "./Question";
import { Document } from "./Document";

@Entity({
    name: 'citation',
    schema: 'dbo'
})
export class Citation {
    @PrimaryColumn()
    citationId!: string;

    @ManyToOne((type) => Form)
    @JoinColumn({ name: 'formId' })
    form: Form;

    @Column({ type: 'int', nullable: true })
    @RelationId((citations: Citation) => citations.form)
    formId: number;

    @ManyToOne((type) => Question)
    @JoinColumn({ name: 'questionId'})
    question: Question;

    @Column({ type: 'int', nullable: true })
    @RelationId((citations: Citation) => citations.question)
    questionId: number;

    @ManyToOne((type) => Document)
    @JoinColumn({ name: 'documentId' })
    document: Document;

    @Column({ type: 'int', nullable: true })
    @RelationId((citations: Citation) => citations.document)
    documentId: number;

    @Column({ type: 'nvarchar', length: 'MAX' })
    excerpt!: string;

    @Column({ type: 'simple-json', nullable: true })
    bounds: JSON;

    @Column('int', {default: 0})
    review: number = 0;

    @Column({ type: 'varchar', length: 255 })
    creator!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    modifiedAt!: Date;
}
