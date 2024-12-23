import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Template } from "./Template";
import { Citation } from "./Citation";
import { Answer } from "./Answer";

@Entity({
    name: 'question',
    schema: 'dbo'
})
export class Question {
    @PrimaryGeneratedColumn()
    questionId!: number;

    @ManyToOne((type) => Template)
    @JoinColumn({ name: 'templateId' })
    template: Template;

    @RelationId((question: Question) => question.template)
    @Column({ type: 'int', nullable: true })
    templateId: number;

    @Column({ type: 'varchar', nullable: true })
    prefix: string;

    @Column({ type: 'varchar', length: 255 })
    text!: string;

    @Column({ type: 'varchar', length: 255 })
    creator: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    modifiedAt!: Date;

    @OneToMany(() => Citation, citation => citation.question)
    citations!: Citation[];

    @RelationId((question: Question) => question.citations)
    citationIds!: string[];

    @OneToMany(() => Answer, answer => answer.question)
    answers!: Answer[];

    @RelationId((question: Question) => question.answers)
    answerIds!: string[];
}
