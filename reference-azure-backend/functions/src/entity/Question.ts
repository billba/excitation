import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Template } from "./Template";
import { Citation } from "./Citation";

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

    @Column('text')
    text!: string;

    @Column('text')
    creator: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    modifiedAt!: Date;

    @OneToMany(() => Citation, citation => citation.question)
    citations!: Citation[];

    @RelationId((question: Question) => question.citations)
    citationIds!: string[];
}