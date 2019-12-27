
let renderPlugIn = (function() {
    //为后端优化，避免对数据库操作过多
    let buffer = {};
    let parentList = {};

    //为数据库优化，防止id增长太快
    let temp_id = -1;
    let free_ids = [];

    /*
     * Tag 根据层数排序方法
     */
    function order_by_layer(a, b) {
        if (a.layer < b.layer) return -1;
        if (a.layer > b.layer) return 1;
        return 0;
    }

    /*
     * 用于给tag找正确的父节点
     */
    function findParent(tag, new_created){
        //寻找父节点
        let parent_li = parentList[tag.parent_id];

        let parent;
        //如果父节点没有children，添加ul为children
        if (parent_li.children('ul').length === 0) {
            parent = $("<ul id= 'Level_" + tag.layer + " class = '> </ul>");
            if (tag.layer > 1 && ! new_created) {
                parent.css('display', "none");
            }
            parent.appendTo(parent_li);
        } else {
            parent = parent_li.children('ul').first();
        }
        return parent;
    }

    /* TODO：添加动态效果
     * 折叠按钮点击事件，子元素折叠/展开
     */
    let toggle = function () {
        $(this).toggleClass("glyphicon-triangle-bottom glyphicon-triangle-top");
        if ($(this).parent('li').children('ul').is(':hidden')) {
            $(this).parent('li').children('ul').css('display', 'block');
        } else {
            $(this).parent('li').children('ul').css('display', 'none');
        }

    };

    /*
     * Tag 改名点击事件
     */
    let changeName = function (event) {
        let $content = ($(this).prev('span'));
        //新Jquery元素
        let $save = $("<button type=\"button\" class=\"btn btn-link \"> Save </button>");
        let $cancel = $("<button type=\"button\" class=\"btn btn-link \"> Cancel </button>");

        let $input = $("<input>", {
                val: $content.text(),
                type: "text"
            }
        );

        let original = $(this).replaceWith($save);
        $cancel.insertAfter($save);

        //替换
        $save.click(function () {
            let newSpan = $("<span class=\"label label-info\"> " + $input.val() + "</span>");

            $save.replaceWith(original);
            $input.replaceWith(newSpan);
            //储存变动
            let toSaveData = {
                id : event.data.tag_id,
                field: 'tag_text',
                new_value : $input.val()
            };
            console.log($input.val());

            if (! buffer.hasOwnProperty(['Update'])){
                buffer['Update'] = [];
            }
            buffer['Update'].push(toSaveData);

            //$content = newSpan;
            original.click({tag_id:event.data.tag_id}, changeName);
            $cancel.css("display","none");
        });

        $content.replaceWith($input);
        $input.select();

        //取消
        $cancel.click(function(){
            $save.replaceWith(original);
            original.click({tag_id:event.data.tag_id}, changeName);
            $(this).css("display","none");
            $input.replaceWith($content);
        });

    };

    /*
     * Tag 增加事件
     */
    let addTag = function (event){

        let word = prompt("新标签名称","");
        if (word){
            let nextId;
            if (free_ids.length === 0){
                console.log("ADD: Free Ids are empty, set to temp + 1");
                nextId= temp_id + 1;
            }
            else{
                console.log("free_ids are not empty, get popped");
                nextId = free_ids.pop();
            }

            let new_tag = {
                id:nextId,
                parent_id: event.data.tag.id,
                tag_text : word,
                layer: event.data.tag.layer+1,
                deleted: false
            };

            //If we are adding back a tag we just deleted?
            let found = false;
            if (buffer.hasOwnProperty('Delete')) {
                //Check if we are deleting the new tag we just added
                buffer['Delete'].forEach(function (newTag, index, array) {
                    if (newTag.id === event.data.tag.id) {
                        found = true;
                        array.splice(index, 1);
                        console.log("We found you Added a tag you just Deleted");
                        return found;
                    }
                });
            }
            if (!found) {
                if (!buffer.hasOwnProperty(['Create'])) {
                    buffer['Create'] = [];
                }
                buffer['Create'].push(new_tag);
            }

            let parent = findParent(new_tag, true);
            appendToParent(parent, new_tag);

            console.log("Added Tag:", new_tag);
            console.log("tempId is: ", temp_id);
            console.log("Free IDs are: ", free_ids);

        }
        temp_id+=1;
    };


    /*
     * Tag 删除事件
     */
    let removeTag = function (event) {
        let result = confirm("确认删除？");
        if (result){
            let toSaveData = {
                id:event.data.tag.id
            };

            let found = false;
            //Check if we are deleting the new tag we just added
            if (buffer.hasOwnProperty('Create')) {
                buffer['Create'].forEach(function (newTag, index, array) {
                    if (newTag.id === event.data.tag.id) {
                        found = true;
                        array.splice(index, 1);
                        console.log("We found you deleted a tag you just added");
                        free_ids.push(newTag.id);
                        return found;
                    }
                });
            }
            //If we are deleting an existing tag
            if (!found) {
                if (!buffer.hasOwnProperty(['Delete'])) {
                    buffer['Delete'] = [];
                }
                buffer['Delete'].push(toSaveData);
                free_ids.push(toSaveData.id);
            }
            console.log("Deleted Tag:", event.data.tag);
            console.log("tempId is: ", temp_id);
            console.log("Free IDs are: ", free_ids);
            $(this).parent().parent().css('display','none');
        }
    };


    /*
     * 创建tag
     * 包含绑定事件
     * TODO: Bootstrap
     */
    function appendToParent(parent, tag){
        console.log(parent);
        console.log(tag);
        //容器
        let $li = $("<li class=\"\"></li>");
        $li.attr('id', "tag_id_" + tag.id);

        // 展开/折叠按钮
        //let $Expand = $("<button class=\"btn btn-secondary btn-sm\" data-toggle=\"button\" aria-pressed=\"false\"> * </button>");
        let $Expand = $("<span class=\"glyphicon glyphicon-triangle-top\"></span>");
        $Expand.click(toggle);
        $li.append($Expand);

        //内容
        let $content = $("<span class=\"label label-info\"> " + tag.tag_text + "</span>");
        $li.append($content);

        //修改
        let $edit = $("<span class=\"glyphicon glyphicon-pencil\">  </span>");
        $edit.click({tag_id : tag.id}, changeName);
        $li.append($edit);

        let $buttonGroup = $("<div class=\"btn-group\" role=\"group\"> </div>");
        $buttonGroup.css({'float':'right', 'margin-right':'30px'});

        //增加
        let $add = $("<span class=\"glyphicon glyphicon-plus\">  </span>");
        $add.click({tag:tag}, addTag);

        //删除
        let $delete = $("<span class=\"glyphicon glyphicon-minus\">  </span>");
        $delete.click({tag:tag}, removeTag);

        $add.appendTo($buttonGroup);
        $delete.appendTo($buttonGroup);
        $buttonGroup.appendTo($li);

        $li.appendTo(parent);

        parentList[tag.id] = $li;
    }

    /*
     * 数据库数据获取
     */
    function fetchAllTags(){
        return new Promise((resolve,reject)=>{
            $.ajax({
                url: 'allTags/',
                type: 'get',
                success: function (data) {
                    let tags = data['tags'];
                    console.log(tags);
                    resolve(tags);
                },
                error:(err)=>{
                    reject(err);
                }
            });
        });
    }

    function upDateAllTags(){
        return new Promise((resolve, reject) =>{
            $.ajax({
                url: 'updateTags/',
                type :'POST',
                data: JSON.stringify(buffer),
                success:function(data){
                    resolve(data);
                },
                error:err=>{
                    reject(err);
                }
            })
        })
    }

    /*
     * 前端渲染
     */
    $(function () {
        fetchAllTags().then(tags => {
            let $root = $("<div id='root'></div>");

            parentList[-1] = $root;
            tags.sort(order_by_layer);

            tags.forEach(function (tag) {
                temp_id = tag.id>temp_id?tag.id:temp_id;
                if(!tag.deleted) {
                    let parent = findParent(tag, false);
                    appendToParent(parent, tag);
                }
            });

            let $addRoot =  $("<button type=\"button\" class=\"btn btn-primary btn-sm\" id='addRoot'> Add Root Node </button>");

            $addRoot.click({tag:{
                    id: -1,
                    layer: 1
                }
            }, addTag);

            $addRoot.prependTo($root);
            let $finish = $("<button type=\"button\" class=\"btn btn-primary btn-sm\" id='finish'> Finish </button>");
            $finish.click(function(){
                upDateAllTags().then(data =>{
                    console.log("Number of Rows Affected: " + data.rowsAffected);
                })
            });

            $finish.insertAfter($addRoot);
            $finish.css("float","right");
            $root.appendTo($('#wrapper'));


            //CSS
            $("#wrapper").css({
                "display" :"block",
                "width" : "30%",
                "height":"100%",
                "padding" : "10px",
                "background-color": "honeydew"
            });

            $("span").css({
                "margin-top": "20px"
            });

        });
    });
})();

