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
    citation_id!: string;

    @ManyToOne((type) => Form)
    @JoinColumn({ name: 'form_id' })
    form: Form;

    @Column({ type: 'int', nullable: true })
    @RelationId((citations: Citation) => citations.form)
    form_id: number;

    @ManyToOne((type) => Question)
    @JoinColumn({ name: 'question_id'})
    question: Question;

    @Column({ type: 'int', nullable: true })
    @RelationId((citations: Citation) => citations.question)
    question_id: number;

    @ManyToOne((type) => Document)
    @JoinColumn({ name: 'document_id' })
    document: Document;

    @Column({ type: 'int', nullable: true })
    @RelationId((citations: Citation) => citations.document)
    document_id: number;

    @Column('text')
    excerpt!: string;

    @Column({ type: 'simple-json', nullable: true })
    bounds: JSON;

    @Column('int', {default: 0})
    review: number = 0;

    @Column('text')
    creator!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    modified_at!: Date;
}