import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Form } from "./Form";
import { Question } from "./Question";
import { Document } from "./Document";

@Entity({
    name: 'answer',
    schema: 'dbo'
})
export class Answer {
    @PrimaryGeneratedColumn()
    answerId!: string;

    @ManyToOne((type) => Form)
    @JoinColumn({ name: 'formId' })
    form: Form;

    @Column({ type: 'int', nullable: true })
    @RelationId((answer: Answer) => answer.form)
    formId: number;

    @ManyToOne((type) => Question)
    @JoinColumn({ name: 'questionId'})
    question: Question;

    @Column({ type: 'int', nullable: false })
    @RelationId((answer: Answer) => answer.question)
    questionId: number;

    @Column({ type: 'nvarchar', length: 255 })
    answer: string;

    @Column({ type: 'varchar', length: 255 })
    creator!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    modifiedAt!: Date;
}
